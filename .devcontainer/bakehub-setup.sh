#!/usr/bin/env bash

## Usage: bakehub-setup.sh <API_KEY>
## This script sets up the development environment for a Bakehub task. It fetches pending tasks from the Bakehub API and runs them using opencode.

API_KEY=$1

## Setup env keys
if [ -f ".env" ]; then
  set -a
  source ".env"
  set +a
fi

REPO_URL="https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/' | sed 's/.*github.com[:/]\(.*\)/\1/')"
BRANCH_NAME="$(git rev-parse --abbrev-ref HEAD)"
BRANCH_NAME_ESCAPED=$(printf '%s' "$BRANCH_NAME" | sed 's/\//%2F/g')

echo ""
REPO_NAME=$(basename -s .git "$REPO_URL")
REPO_NAME_ESCAPED=$(printf '%s' "$REPO_NAME" | sed 's/\//%2F/g')
response_tasks=$(curl -H "x-api-key: $API_KEY" "https://ajfjzspcfmryesrkxuca.supabase.co/functions/v1/api?action=get-pending-tasks&repository_name=$REPO_NAME_ESCAPED&branch_name=$BRANCH_NAME_ESCAPED")


echo ""
echo "Tasks fetched successfully:"
echo "$response_tasks" | jq .
echo ""

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to parse response_tasks JSON. Please install jq and try again."
  exit 1
fi

# Pick the first task where status is pending.
pending_task=$(echo "$response_tasks" | jq -c '((.tasks // .) | map(select(.status == "pending")) | .[0])')

if [ -z "$pending_task" ] || [ "$pending_task" = "null" ]; then
  echo "No pending tasks found."
  exit 0
fi

# Create variables with the pending task title and description.
TASK_TITLE=$(echo "$pending_task" | jq -r '.title')
TASK_DESCRIPTION=$(echo "$pending_task" | jq -r '.description')

echo "RUN opencode tasks"

opencode run --title "$TASK_TITLE" "$TASK_DESCRIPTION - do the task and create a pull request with the current branch. Add the automerge label."
