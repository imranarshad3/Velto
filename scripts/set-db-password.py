"""Prompt for the Supabase database password (hidden) and write a correctly encoded,
quoted SUPABASE_DB_URL into .env. The password is never echoed or logged."""
import getpass
import re
import urllib.parse

PROJECT = 'flszrsxbmddnrjhfpjnl'
HOST = 'aws-0-ap-southeast-1.pooler.supabase.com:5432'

password = getpass.getpass('New Supabase database password: ')
if not password or password != getpass.getpass('Repeat it: '):
    raise SystemExit('Passwords were empty or did not match; .env unchanged.')
url = f'postgresql://postgres.{PROJECT}:{urllib.parse.quote(password, safe="")}@{HOST}/postgres'

with open('.env') as f:
    lines = f.readlines()
line = f'SUPABASE_DB_URL="{url}"\n'
found = False
for i, current in enumerate(lines):
    if re.match(r'\s*SUPABASE_DB_URL\s*=', current):
        lines[i], found = line, True
if not found:
    lines.append(line)
with open('.env', 'w') as f:
    f.writelines(lines)
print('SUPABASE_DB_URL updated in .env.')
