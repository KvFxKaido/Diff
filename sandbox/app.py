"""
Modal Python App — Sandbox CRUD for Push.

Exposes 9 web endpoints as plain HTTPS POST routes.
Each endpoint receives JSON and returns JSON.
Browser never talks to this directly — Cloudflare Worker proxies all calls.

Deploy: cd sandbox && python -m modal deploy app.py
"""

import modal
import base64
import json
import hmac
import secrets
import urllib.request

app = modal.App("push-sandbox")

# Image for sandbox containers (cloned repos run here)
sandbox_image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("git", "curl")
    .pip_install("ruff", "pytest")
    .run_commands(
        "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -",
        "apt-get install -y nodejs",
        # Default git identity — overridden per-session when GitHub token is available
        "git config --global user.email 'sandbox@diff.app'",
        "git config --global user.name 'Push User'",
    )
)

# Image for the web endpoint functions themselves (needs FastAPI)
endpoint_image = modal.Image.debian_slim(python_version="3.12").pip_install("fastapi[standard]")
OWNER_TOKEN_FILE = "/tmp/push-owner-token"


def _fetch_github_user(token: str) -> tuple[str, str]:
    """Fetch name and email from GitHub API. Returns (name, email) or defaults."""
    try:
        req = urllib.request.Request(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
            },
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            user = json.loads(resp.read())
        name = user.get("name") or user.get("login", "Push User")
        login = user.get("login", "user")
        email = user.get("email") or f"{login}@users.noreply.github.com"
        return name, email
    except Exception:
        return "Push User", "sandbox@push.app"


def _issue_owner_token(sb: modal.Sandbox) -> str | None:
    token = secrets.token_urlsafe(32)
    p = sb.exec(
        "python3",
        "-c",
        (
            "import pathlib,sys;"
            f"p=pathlib.Path('{OWNER_TOKEN_FILE}');"
            "p.write_text(sys.argv[1], encoding='utf-8');"
            "p.chmod(0o600)"
        ),
        token,
    )
    p.wait()
    if p.returncode != 0:
        return None
    return token


def _validate_owner_token(sb: modal.Sandbox, provided_token: str) -> bool:
    if not provided_token:
        return False
    p = sb.exec(
        "python3",
        "-c",
        (
            "import pathlib;"
            f"p=pathlib.Path('{OWNER_TOKEN_FILE}');"
            "print(p.read_text(encoding='utf-8') if p.exists() else '')"
        ),
    )
    p.wait()
    if p.returncode != 0:
        return False
    expected = p.stdout.read().strip()
    return bool(expected) and hmac.compare_digest(expected, str(provided_token))


@app.function(image=endpoint_image)
@modal.fastapi_endpoint(method="POST")
def create(data: dict):
    """Clone repo into a new sandbox, return sandbox_id."""
    sb = modal.Sandbox.create(
        "sleep",
        "infinity",
        app=app,
        image=sandbox_image,
        timeout=1800,
    )

    github_token = data.get("github_token", "")
    repo = data.get("repo", "")
    branch = data.get("branch", "main")

    if not repo:
        sb.terminate()
        return {"error": "Missing repo", "sandbox_id": None}

    if github_token:
        clone_url = f"https://x-access-token:{github_token}@github.com/{repo}.git"
    else:
        clone_url = f"https://github.com/{repo}.git"

    p = sb.exec("git", "clone", "--depth=50", "--branch", branch, clone_url, "/workspace")
    p.wait()

    if p.returncode != 0:
        stderr = p.stderr.read()
        sb.terminate()
        return {"error": f"Clone failed: {stderr}", "sandbox_id": None}

    # Configure git identity so commits work inside the sandbox
    if github_token:
        name, email = _fetch_github_user(github_token)
    else:
        name, email = "Push User", "sandbox@push.app"
    sb.exec("git", "config", "--global", "user.name", name).wait()
    sb.exec("git", "config", "--global", "user.email", email).wait()

    owner_token = _issue_owner_token(sb)
    if not owner_token:
        sb.terminate()
        return {"error": "Failed to initialize sandbox access token", "sandbox_id": None}

    return {"sandbox_id": sb.object_id, "owner_token": owner_token, "status": "ready"}


@app.function(image=endpoint_image)
@modal.fastapi_endpoint(method="POST")
def exec_command(data: dict):
    """Run a command in an existing sandbox."""
    sandbox_id = data.get("sandbox_id")
    owner_token = data.get("owner_token", "")
    command = data.get("command", "")
    workdir = data.get("workdir", "/workspace")

    if not sandbox_id or not command:
        return {"error": "Missing sandbox_id or command", "exit_code": -1}

    sb = modal.Sandbox.from_id(sandbox_id)
    if not _validate_owner_token(sb, owner_token):
        return {"error": "Unauthorized sandbox access", "exit_code": -1}
    p = sb.exec("bash", "-c", f"cd {workdir} && {command}")
    p.wait()

    stdout = p.stdout.read()
    stderr = p.stderr.read()

    return {
        "stdout": stdout[:10_000],
        "stderr": stderr[:5_000],
        "exit_code": p.returncode,
        "truncated": len(stdout) > 10_000 or len(stderr) > 5_000,
    }


@app.function(image=endpoint_image)
@modal.fastapi_endpoint(method="POST")
def read_file(data: dict):
    """Read a file from the sandbox."""
    sandbox_id = data.get("sandbox_id")
    owner_token = data.get("owner_token", "")
    path = data.get("path", "")

    if not sandbox_id or not path:
        return {"error": "Missing sandbox_id or path"}

    sb = modal.Sandbox.from_id(sandbox_id)
    if not _validate_owner_token(sb, owner_token):
        return {"error": "Unauthorized sandbox access", "content": ""}
    p = sb.exec("cat", path)
    p.wait()

    if p.returncode != 0:
        stderr = p.stderr.read()
        return {"error": f"Read failed: {stderr}", "content": ""}

    content = p.stdout.read()
    return {"content": content[:50_000], "truncated": len(content) > 50_000}


@app.function(image=endpoint_image)
@modal.fastapi_endpoint(method="POST")
def write_file(data: dict):
    """Write a file in the sandbox."""
    sandbox_id = data.get("sandbox_id")
    owner_token = data.get("owner_token", "")
    path = data.get("path", "")
    content = data.get("content", "")

    if not sandbox_id or not path:
        return {"ok": False, "error": "Missing sandbox_id or path"}

    sb = modal.Sandbox.from_id(sandbox_id)
    if not _validate_owner_token(sb, owner_token):
        return {"ok": False, "error": "Unauthorized sandbox access"}

    # Escape single quotes in path for shell safety
    safe_path = path.replace("'", "'\\''")

    # Step 1: Create parent directory
    p = sb.exec("bash", "-c", f"mkdir -p \"$(dirname '{safe_path}')\"")
    p.wait()
    if p.returncode != 0:
        stderr = p.stderr.read()
        return {"ok": False, "error": f"Failed to create directory: {stderr}"}

    # Step 2: Write file using base64 encoding for safe content transfer.
    # Use printf instead of echo (no trailing newline interpretation).
    encoded = base64.b64encode(content.encode()).decode()
    p = sb.exec(
        "bash",
        "-c",
        f"printf '%s' '{encoded}' | base64 -d > '{safe_path}'",
    )
    p.wait()

    if p.returncode != 0:
        stderr = p.stderr.read()
        return {"ok": False, "error": f"Write failed: {stderr}"}

    # Step 3: Verify the file exists and has content (catches silent write failures)
    p = sb.exec("bash", "-c", f"wc -c < '{safe_path}'")
    p.wait()

    if p.returncode != 0:
        return {"ok": False, "error": "Verification failed — file may not have been written"}

    written_bytes = p.stdout.read().strip()
    return {
        "ok": True,
        "bytes_written": int(written_bytes) if written_bytes.isdigit() else 0,
    }


@app.function(image=endpoint_image)
@modal.fastapi_endpoint(method="POST")
def get_diff(data: dict):
    """Get git diff of all changes."""
    sandbox_id = data.get("sandbox_id")
    owner_token = data.get("owner_token", "")

    if not sandbox_id:
        return {"error": "Missing sandbox_id", "diff": ""}

    sb = modal.Sandbox.from_id(sandbox_id)
    if not _validate_owner_token(sb, owner_token):
        return {"error": "Unauthorized sandbox access", "diff": ""}

    # Step 1: Clear stale index lock (left by crashed git operations)
    sb.exec("bash", "-c", "rm -f /workspace/.git/index.lock").wait()

    # Step 2: Check git status first to diagnose "no changes" issues
    p = sb.exec("bash", "-c", "cd /workspace && git status --porcelain")
    p.wait()
    status_output = p.stdout.read().strip()
    status_stderr = p.stderr.read().strip()

    if status_stderr:
        return {"error": f"git status failed: {status_stderr}", "diff": ""}

    if not status_output:
        # No changes detected by git — return empty diff with diagnostic info
        return {"diff": "", "truncated": False, "git_status": "clean"}

    # Step 3: Stage all changes
    p = sb.exec("bash", "-c", "cd /workspace && git add -A")
    p.wait()
    if p.returncode != 0:
        stderr = p.stderr.read()
        return {"error": f"git add failed: {stderr}", "diff": ""}

    # Step 4: Get the diff of staged changes
    p = sb.exec("bash", "-c", "cd /workspace && git diff --cached")
    p.wait()

    diff = p.stdout.read()
    return {
        "diff": diff[:20_000],
        "truncated": len(diff) > 20_000,
        "git_status": status_output[:2_000],
    }


@app.function(image=endpoint_image)
@modal.fastapi_endpoint(method="POST")
def list_dir(data: dict):
    """List directory contents with metadata."""
    sandbox_id = data.get("sandbox_id")
    owner_token = data.get("owner_token", "")
    path = data.get("path", "/workspace")

    if not sandbox_id:
        return {"error": "Missing sandbox_id", "entries": []}

    sb = modal.Sandbox.from_id(sandbox_id)
    if not _validate_owner_token(sb, owner_token):
        return {"error": "Unauthorized sandbox access", "entries": []}
    script = """
import json
import os
import sys

target = sys.argv[1]

try:
    entries = []
    with os.scandir(target) as it:
        for entry in it:
            if entry.name in (".", ".."):
                continue

            try:
                if entry.is_dir(follow_symlinks=False):
                    entries.append({"name": entry.name, "type": "directory", "size": 0})
                elif entry.is_file(follow_symlinks=False):
                    size = 0
                    try:
                        size = entry.stat(follow_symlinks=False).st_size
                    except Exception:
                        size = 0
                    entries.append({"name": entry.name, "type": "file", "size": size})
            except Exception:
                continue

    entries.sort(key=lambda e: (0 if e["type"] == "directory" else 1, e["name"].lower()))
    print(json.dumps({"ok": True, "entries": entries}))
except Exception as exc:
    print(json.dumps({"ok": False, "error": str(exc)}))
"""

    p = sb.exec("python3", "-c", script, path)
    p.wait()

    if p.returncode != 0:
        stderr = p.stderr.read()
        return {"error": f"List failed: {stderr}", "entries": []}

    stdout = p.stdout.read().strip()
    if not stdout:
        return {"entries": []}

    try:
        parsed = json.loads(stdout)
    except Exception:
        return {"error": "List failed: invalid response from sandbox", "entries": []}

    if not parsed.get("ok"):
        return {"error": f"List failed: {parsed.get('error', 'Unknown error')}", "entries": []}

    base = path.rstrip("/") or "/"
    entries = []
    for item in parsed.get("entries", []):
        name = item.get("name", "")
        if not name:
            continue
        entry_path = f"/{name}" if base == "/" else f"{base}/{name}"
        entries.append({
            "name": name,
            "path": entry_path,
            "type": "directory" if item.get("type") == "directory" else "file",
            "size": int(item.get("size", 0) or 0),
        })

    return {"entries": entries}


@app.function(image=endpoint_image)
@modal.fastapi_endpoint(method="POST")
def delete_file(data: dict):
    """Delete a file or directory from the sandbox."""
    sandbox_id = data.get("sandbox_id")
    owner_token = data.get("owner_token", "")
    path = data.get("path", "")

    if not sandbox_id or not path:
        return {"ok": False, "error": "Missing sandbox_id or path"}

    # Safety: prevent deleting workspace root or system paths
    if path in ("/", "/workspace", "/workspace/"):
        return {"ok": False, "error": "Cannot delete workspace root"}

    sb = modal.Sandbox.from_id(sandbox_id)
    if not _validate_owner_token(sb, owner_token):
        return {"ok": False, "error": "Unauthorized sandbox access"}
    p = sb.exec("rm", "-rf", path)
    p.wait()

    return {"ok": p.returncode == 0}


@app.function(image=endpoint_image)
@modal.fastapi_endpoint(method="POST")
def cleanup(data: dict):
    """Terminate a sandbox."""
    sandbox_id = data.get("sandbox_id")
    owner_token = data.get("owner_token", "")

    if not sandbox_id:
        return {"ok": False, "error": "Missing sandbox_id"}

    sb = modal.Sandbox.from_id(sandbox_id)
    if not _validate_owner_token(sb, owner_token):
        return {"ok": False, "error": "Unauthorized sandbox access"}
    sb.terminate()
    return {"ok": True}
