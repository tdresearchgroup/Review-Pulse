import sys
import pandas as pd
import os

sys.path.append(r'C:\Program Files\SciTools\bin\pc-win64\Python')
os.add_dll_directory(r"C:\Program Files\SciTools\bin\pc-win64")

import understand
from Getsmells import app

App = app.App



PROJECT_PATH = r"PROJECT_PATH"
DEFAULT_OUTPUT = r"OUTPUT_PATH"

def checkout_release(release):
    os.chdir(PROJECT_PATH)
    os.system(f"git checkout {release}")
    os.chdir(r"T:\Desktop\Thesis\smellsCollection\output")

def get_smells():
    tags = pd.read_json("releases.json")
    for tag in tags['tagName']:
        VERSION = tag
        PROJECT_NAME = "bitcoin-wallet" + "_" + VERSION
        print(f"Checking out {VERSION}...")
        checkout_release(tag)
        
        app = App(PROJECT_PATH, DEFAULT_OUTPUT, PROJECT_NAME, VERSION)
        app.analyzeCode()

        print(f"Extracting smells from {VERSION}...")

        app.extractSmells()

        print(f"Done {VERSION}...")
        print(f"---------------------")