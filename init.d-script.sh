#!/bin/bash
#
### BEGIN INIT INFO
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Should-Start:      $network $time
# Should-Stop:       $network $time
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Start and stop the daemon
# Description:       Controls the main daemon
### END INIT INFO
#
. /lib/lsb/init-functions
set -e
set -u
SELF=`realpath "${BASH_SOURCE[0]}"`
cd `dirname "$SELF"`
DIR=`pwd`
NAME=`basename "$DIR"`
PIDFILE="$DIR/$NAME.pid"
DAEMON=`realpath "./server.js"`
DAEMON_ARGS="--http.port 18080"
CHUID=`stat -c '%U:%G' "$DIR"`

test -x "$DAEMON" || (echo "Executable not found at $DAEMON" && exit 1)

ERRLOG="/var/log/$NAME.err.log"

# Safeguard (relative paths, core dumps..)
#cd /
#umask 077

#
# main()
#

case "${1:-''}" in
	'start')
		touch "$ERRLOG" && chown "$CHUID" "$ERRLOG"
		if start-stop-daemon --start --background -m --pidfile "$PIDFILE" --chuid "$CHUID" --chdir "$DIR" --no-close --exec "$DAEMON" -- $DAEMON_ARGS 2>>$ERRLOG
		then
			echo "$NAME."
			exit 0
		else
			echo "failed"
			exit 1
		fi
	;;

	'stop')
		echo -n "Stopping $NAME: "
		if start-stop-daemon --stop --pidfile "$PIDFILE" --retry forever/TERM/1
		then
			echo "$NAME."
			exit 0
		else
			echo "failed"
			exit 1
		fi
	;;

	'restart')
		set +e; $SELF stop; set -e
		$SELF start
	;;

	'status')
		status_of_proc -p "$PIDFILE" "$DAEMON" "$NAME"

		PID=`test -f "$PIDFILE" && cat "$PIDFILE" || echo ''`
		echo "PID	$PID"
		echo "DIR	$DIR"
		echo "NAME	$NAME"
		echo "DAEMON	$DAEMON"
		echo "ERRLOG	$ERRLOG"
		echo "PIDFILE	$PIDFILE"
	;;

	*)
		echo "Usage: $SELF start|stop|restart|status"
		exit 1
	;;
esac

exit 0
