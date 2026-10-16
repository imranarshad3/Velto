"""Prompt for the Supabase database password (hidden) and write a correctly encoded,
quoted SUPABASE_DB_URL into .env. The password is never echoed or logged."""
import getpass
import os
import re
import urllib.parse

project = os.environ.get('SUPABASE_PROJECT_ID')
host = os.environ.get('SUPABASE_DB_HOST') or 'aws-0-ap-southeast-1.pooler.supabase.com:5432'

if not project and os.path.exists('.env'):
    with open('.env') as f:
        for line in f:
            m = re.match(r'\s*SUPABASE_URL\s*=\s*["\']?https://([a-z0-9_-]+)\.supabase\.co', line)
            if m:
                project = m.group(1)
                break

if not project:
    project = input('Supabase Project ID (e.g. from https://<id>.supabase.co): ').strip()
if not project:
    raise SystemExit('Project ID is required; .env unchanged.')

password = getpass.getpass('New Supabase database password: ')
if not password or password != getpass.getpass('Repeat it: '):
    raise SystemExit('Passwords were empty or did not match; .env unchanged.')
url = f'postgresql://postgres.{project}:{urllib.parse.quote(password, safe="")}@{host}/postgres'

lines = []
if os.path.exists('.env'):
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
