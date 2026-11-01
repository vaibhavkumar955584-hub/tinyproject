"""Edit this file to point your radar at your own companies and goals."""
import os

from dotenv import load_dotenv

# Reads TINYFISH_API_KEY from your .env file (the SDK then picks it up on its own)
load_dotenv()

if not os.getenv("TINYFISH_API_KEY"):
    raise SystemExit(
        "TINYFISH_API_KEY is not set.\n"
        "Copy .env.example to .env and paste your key from agent.tinyfish.ai/api-keys"
    )

# What you want, in plain English. Naming the fields gives cleaner JSON.
GOAL = (
    "Find software or AI internships for students. "
    "Return JSON: a list of role, location, deadline, link."
)

# Company name -> careers page. Add your own!
PAGES = {
    # "Jane Street": "https://www.janestreet.com/join-jane-street/open-roles/",
    "LinkedIn": "https://www.linkedin.com/jobs/search-results/?currentJobId=4485150101&eBP=CwEAAAGhlZUqfSqFD4Lsma6Etxj6orwHpZnHZfS1tJu9SOC5Wz3raskXv1VXeiNg4-aK2fuu7SBCuzRPQxvkUj4C1JOTmwL1H2uDM1rMFpUN4YZTiOw9c-gWsry5UKGcYgdmGERee9uKXR9Bu2c1Ej6XYBvHOlSGKNfo8Puk8PPj3A4DBFxeOr1StwSMVJNpk3gtPYEkoRATsskvLhKkX5_SmEWkygaltR3x2Mwkp-C_PQNH4bLwsUzFUGtgS1WHf9_oAgz2qWgID8G2Mo8_RfRsTWjqzai4wK1CC9x1pg7msibAc4tvmYY4RDejjKPeY2UiAw93gUjXlcc2yJAzCwRb_2zKonVhArYlQNxSkfdR-z3L2drQAXnEiBjRH350HPGPu35ICP9YSNthrkyxLkNSnSmuqjDrmG__lVEZTFnVdnWsypxeIBi5Lexb1hDvORMELJXqoaE6NFAW_CWlGbywFaGo-LVV6C34MgWgsdL-GD4dGMy2EmFF_GFscHMVou2bCPqb9g&refId=41gR0vmBJ5kBcyyJfQ9MVw%3D%3D&trackingId=1tWc%2Bt2ejIvTmd0tJLh%2Bog%3D%3D&keywords=part-time%20or%20intern%20Java%20Software%20Developer%20or%20Spring%20Intern%2C%20remote&origin=PREFERENCES_LANDING&geoId=114195006", 
     "linkedIn": "https://www.linkedin.com/in/amiitt001/" ,# TODO: replace with a real careers URL
}

# Used by stage 4: Search decides which pages to open
SEARCH_QUERY = "software engineering internship apply"
MAX_SEARCH_PAGES = 5

OUTPUT_FILE = "internships.json"
