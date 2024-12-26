

# fix permission issue of bind mount dir volumes 
chown -R root:root /app
# npm install create-react-app
exec "$@"