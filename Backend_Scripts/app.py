from collect_reviews import get_reviews
from analyze_reviews import *
from label_reviews import label_reviews
from get_releases import get_releases
from extract_code_smells import get_smells

app_package_name = "package_name"
app_repo_url = "repo_url"

# Collect Reviews, Label Reviews, Analyze Reviews
get_reviews(app_package_name)
get_sentiment()
get_toxicity()
label_reviews()

# Get Releases, Extract Code Smells
get_releases(app_repo_url)
get_smells()