#!/bin/sh
set -eu

PROJECT_DIR="/project"
PUBLIC_DIR="$PROJECT_DIR/public"
REPO_URL="${REPO_URL:-https://github.com/ianbrunjes/pfmweb-react.git}"
REPO_BRANCH="${REPO_BRANCH:-main}"
CLONE_DIR="/tmp/pfmweb-repo"

preserve_project_mounts() {
  find "$PROJECT_DIR" -mindepth 1 -maxdepth 1 \
    \( -name public -o -name entrypoint.sh -o -name web_data_latest.nc \) -prune \
    -o -exec rm -rf {} +
}

fresh_clone() {
  rm -rf "$CLONE_DIR"
  git clone --branch "$REPO_BRANCH" --single-branch "$REPO_URL" "$CLONE_DIR"
  preserve_project_mounts
  cp -a "$CLONE_DIR/." "$PROJECT_DIR/"
}

sync_repo() {
  if [ ! -d "$PROJECT_DIR/.git" ]; then
    fresh_clone
    return
  fi

  cd "$PROJECT_DIR"
  current_url="$(git config --get remote.origin.url || true)"

  if [ "$current_url" != "$REPO_URL" ]; then
    fresh_clone
    return
  fi

  git fetch origin "$REPO_BRANCH"
  git reset --hard "origin/$REPO_BRANCH"
  git clean -fdx -e public/ -e entrypoint.sh -e web_data_latest.nc
}

publish_dist() {
  mkdir -p "$PUBLIC_DIR"
  chown -R "$(id -u):$(id -g)" "$PUBLIC_DIR" || true
  find "$PUBLIC_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  cp -a "$PROJECT_DIR/dist/." "$PUBLIC_DIR/"
  chown -R "$(id -u):$(id -g)" "$PUBLIC_DIR" || true
}

sync_repo

cd "$PROJECT_DIR"
python3 -m pip install -r requirements.txt
npm ci
npm run clean
npm run build
publish_dist
