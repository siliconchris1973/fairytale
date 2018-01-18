#!/bin/bash
TAG="$1"

curl -X GET -H "Content-type: application/json" -H "Accept: application/json"  "http://127.0.0.1:3000/rfid/tags/tag?tag=31455D"
