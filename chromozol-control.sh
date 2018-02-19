#!/bin/sh
# Startup script for Chromozol Control

SOCKET=/tmp/chromozol-control.fifo
if [ -e $SOCKET ] ; then
    echo "Deleting $SOCKET"
    rm -f $SOCKET
fi

mkfifo $SOCKET && \
    websocketd --port=7080 --address=localhost tail -f $SOCKET
