

Admin	kumavikram@gmail.com	Welcome@123
Seeker	seeker@test.com	TestPass123
Astrologer	astro@test.com	TestPass123


server:

Seeker:
astroshiv2005.sk@gmail.com
G&cnRe9jr$z(

Astrologer:
raman.bharadwaj@aadikarta.org
8cSV!DsTbqWYU4q


# Local
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build

# VPS (bring up the standalone DB once first)
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d --build


# 1. pull the latest code so sync-cert-store.sh is on the VPS
cd /root/aadikarta-app/production
git pull origin main

# 2. make it executable
chmod +x deploy/sync-cert-store.sh

# 3. do a dry test run first -- since certs currently match (we just fixed
#    both), this should exit silently with no log output
./deploy/sync-cert-store.sh
cat /root/global-proxy/certbot/sync-cert-store.log 2>&1   # expect: no new lines, or file doesn't exist yet

# 4. install the cron job (3am daily)
crontab -l > /tmp/cron.bak 2>/dev/null || true
(crontab -l 2>/dev/null; echo "0 3 * * * /root/aadikarta-app/production/deploy/sync-cert-store.sh") | crontab -

# 5. confirm it's installed
crontab -l



http://manage.bigrock.in/linkhandler/servlet/ViewCustomerTransactionsServlet?transid=139482007&role=customer

vikram@aavyalabs.com
ViKr@m#2026


The Bio/Description (Copy-Paste this): Aadikarta Astrology (aadikarta.org) is an official digital platform operated by Aadikarta Vedic Astro Private Limited. We connect global users with verified, authentic Vedic astrologers and tarot readers for secure online consultations.

Aadikarta Astrology (aadikarta.org), by Aadikarta Vedic Astro Pvt Ltd, connects global users with verified Vedic astrologers and tarot readers online. (143 chars)

Aadikarta Astrology (aadikarta.org) is Aadikarta Vedic Astro Pvt Ltd's official platform for secure consultations with verified Vedic astrologers. (139 chars)

We're Aadikarta Vedic Astro Pvt Ltd, running aadikarta.org to connect users worldwide with authentic, verified Vedic astrologers and tarot readers. (146 chars)



=====================================

REVIEWS:

Acharya Shiv provided extremely clear and accurate guidance on my career transit. His remedies were practical and easy to follow. Highly recommended for genuine Vedic predictions!


Very detailed and insightful Kundli analysis. Acharya Shiv explained the planetary Dasha timing patiently and answered all my questions with great clarity.


Insightful consultation! Acharya Shiv gave precise answers regarding relationship compatibility and Mahadasha changes. Felt much more confident after the chat session.

Acharya Raman is an outstanding Vedic astrologer. He identified key planetary placements in my birth chart instantly and gave positive, realistic remedies.


Name: Vikram Kumar
Date: 27
Month: 08
Year: 1975
HH: 04
MM: 40
SS: 0
Place: Katihar, Bihar, India

