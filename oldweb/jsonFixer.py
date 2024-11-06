import json


def flatten_lsts(nested):
    flattened = {}
    if isinstance(nested, dict):
        flattened.update(nested)
    elif isinstance(nested, list):
        for item in nested:
            flattened.update(flatten_lsts(item))
    return flattened


def fix():
    with open("links.json", "r+") as f:
        data = f.read()
        data = data.replace("}{", "},{")
        data = f"[{data}]"
        data = json.loads(data)
        f.seek(0)
        f.write(json.dumps(data, indent=2))
        f.close()
    with open("links.json", "r+") as f:
        data = json.load(f)
        data = flatten_lsts(data)
        f.seek(0)
        f.write(json.dumps(data, indent=2))
        f.truncate()
        f.close()
