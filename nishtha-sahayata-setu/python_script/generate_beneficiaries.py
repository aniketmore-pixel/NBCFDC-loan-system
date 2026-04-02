"""
generate_beneficiaries_supabase.py
"""

import os
import random
import string
from faker import Faker
from supabase import create_client
import time
import argparse
from dotenv import load_dotenv

load_dotenv()

DEFAULT_N = 1800
BATCH_SIZE = 200
SEED = 42

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise SystemExit("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables before running.")

faker = Faker("en_IN")
random.seed(SEED)
faker.seed_instance(SEED)


def gen_safe_aadhar(existing_set):
    while True:
        suffix = random.randint(0, 10**10 - 1)
        aadhar_str = f"99{suffix:010d}"
        aadhar_int = int(aadhar_str)
        if aadhar_int not in existing_set:
            existing_set.add(aadhar_int)
            return aadhar_int


def random_mobile():
    return str(random.randint(6000000000, 9999999999))


def generate_password(length=10):
    """Generate a random secure password"""
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(random.choice(chars) for _ in range(length))


def pick_state_and_district():
    states = {
        "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik"],
        "Karnataka": ["Bengaluru Urban", "Mysuru", "Mangalore"],
        "Uttar Pradesh": ["Lucknow", "Kanpur", "Prayagraj"],
        "Bihar": ["Patna", "Gaya", "Muzaffarpur"],
        "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
        "West Bengal": ["Kolkata", "Howrah", "Darjeeling"],
        "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur"],
        "Gujarat": ["Ahmedabad", "Surat", "Vadodara"]
    }
    state = random.choice(list(states.keys()))
    district = random.choice(states[state])
    return state, district


def gen_income_by_occupation(occupation):
    if occupation == "Farmer":
        return int(min(max(random.gauss(90000, 40000), 25000), 300000))
    if occupation == "Salaried":
        return int(min(max(random.gauss(300000, 150000), 80000), 1500000))
    if occupation == "Small Trader":
        return int(min(max(random.gauss(180000, 100000), 40000), 900000))
    if occupation == "Self-employed":
        return int(min(max(random.gauss(200000, 140000), 30000), 1200000))
    if occupation == "Daily Wage":
        return int(min(max(random.gauss(70000, 30000), 20000), 200000))
    return int(min(max(random.gauss(100000, 80000), 5000), 400000))


def safe_check_error(resp):
    """Unified error checker for all Supabase client versions"""
    return (
        getattr(resp, "error", None)
        or getattr(resp, "error_message", None)
        or (resp.data is None and getattr(resp, "status_code", 200) >= 400)
    )


def generate_and_insert(n=DEFAULT_N):
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    existing_aadhars = set()
    occupations = ["Farmer", "Small Trader", "Salaried", "Self-employed", "Daily Wage", "Unemployed"]

    batch = []
    total_inserted = 0
    start_time = time.time()

    for i in range(n):
        aadhar = gen_safe_aadhar(existing_aadhars)
        name = faker.name()
        age = int(max(18, min(70, round(random.gauss(37, 10)))))
        gender = random.choices(["Male", "Female", "Other"], weights=[0.48, 0.48, 0.04])[0]
        phone = random_mobile()
        address = faker.address().replace("\n", ", ")
        occupation = random.choices(occupations, weights=[0.20, 0.20, 0.25, 0.15, 0.15, 0.05])[0]
        income = gen_income_by_occupation(occupation)
        state, district = pick_state_and_district()
        reg_date = faker.date_between(start_date="-5y", end_date="today").isoformat()
        password = generate_password()

        row = {
            "aadhar_no": aadhar,
            "full_name": name,
            "age": age,
            "gender": gender,
            "phone_no": phone,
            "address": address,
            "income_yearly": income,
            "state": state,
            "district": district,
            "occupation": occupation,
            "registration_date": reg_date,
            "password": password
        }

        batch.append(row)

        if len(batch) >= BATCH_SIZE:
            resp = supabase.table("beneficiary").insert(batch).execute()
            error = safe_check_error(resp)
            if error:
                print("\n❌ Error inserting batch:", error)
                print("Response object:", resp)
                raise SystemExit(1)

            total_inserted += len(batch)
            print(f"Inserted {total_inserted}/{n} rows...")
            batch = []

    # Insert last remaining batch
    if batch:
        resp = supabase.table("beneficiary").insert(batch).execute()
        error = safe_check_error(resp)
        if error:
            print("\n❌ Error inserting final batch:", error)
            print("Response object:", resp)
            raise SystemExit(1)

        total_inserted += len(batch)
        print(f"Inserted {total_inserted}/{n} rows...")

    elapsed = time.time() - start_time
    print(f"\n✅ Done. Inserted {total_inserted} rows in {elapsed:.1f}s")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=DEFAULT_N)
    args = parser.parse_args()
    generate_and_insert(args.n)
