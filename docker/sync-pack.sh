#!/bin/bash
set -euo pipefail

echo "[pack-sync] Syncing immutable modpack files into /data"

DATA_UID=$(stat -c '%u' /data)
DATA_GID=$(stat -c '%g' /data)

echo "[pack-sync] /data owner is ${DATA_UID}:${DATA_GID}"

MANAGED_DIRS=(
    mods
    config
    kubejs
    defaultconfigs
    scripts
)

# Preserve server-specific configuration files.
PRESERVED_CONFIGS=(
    discordintegration-server.toml
)

# Temporary directory automatically cleaned up on exit.
BACKUP_DIR=$(mktemp -d)
trap 'rm -rf "$BACKUP_DIR"' EXIT

# Back up server-specific configurations.
mkdir -p "$BACKUP_DIR/config"

for file in "${PRESERVED_CONFIGS[@]}"; do
    if [ -f "/data/config/$file" ]; then
        echo "[pack-sync] Preserving $file"
        cp -a "/data/config/$file" "$BACKUP_DIR/config/"
    fi
done

# Synchronize modpack files.
for dir in "${MANAGED_DIRS[@]}"; do
    if [ -d "/pack-template/$dir" ]; then
        echo "[pack-sync] Updating $dir"

        rm -rf "/data/$dir"
        cp -a "/pack-template/$dir" "/data/$dir"

        # Restore preserved configurations.
        if [ "$dir" = "config" ]; then
            for file in "${PRESERVED_CONFIGS[@]}"; do
                if [ -f "$BACKUP_DIR/config/$file" ]; then
                    echo "[pack-sync] Restoring $file"
                    cp -a "$BACKUP_DIR/config/$file" "/data/config/$file"
                fi
            done
        fi

        chown -R "${DATA_UID}:${DATA_GID}" "/data/$dir"
    fi
done

echo "[pack-sync] Pack sync complete"

exec /image/scripts/start "$@"