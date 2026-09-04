#!/usr/bin/env bash

# Start MongoDB in the background
mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db --bind_ip 0.0.0.0 --port 27017

# Wait for MongoDB to be ready
for i in {1..30}; do
    if mongosh --eval "db.adminCommand('ping')" --quiet 2>/dev/null; then
        echo "MongoDB is ready"
        exit 0
    fi
    sleep 1
done

echo "MongoDB failed to start"
exit 1