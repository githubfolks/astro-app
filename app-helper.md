Seeker:
Email: seeker@test.com
Password: password

Astrologer:
Email: astro@test.com
Password: password

Email: admin@test.com
Password: adminpassword


npm run build && npx cap sync

# Create a new migration (after changing models.py):

python3 migrate.py create "message_describing_change"

# Apply all pending migrations (Upgrade):

python3 migrate.py up

# Downgrade last migration:

python3 migrate.py down

# Run specific revision:

python3 migrate.py run <revision_id>