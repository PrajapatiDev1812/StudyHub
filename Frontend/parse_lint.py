import json

with open("lint_report_3.json", "r", encoding="utf-16") as f:
    report = json.load(f)

for file in report:
    if file["messages"]:
        print(f"\n{file['filePath']}:".encode('utf-8', 'ignore').decode('utf-8'))
        for msg in file["messages"]:
            out = f"  Line {msg['line']}: {msg['message']} ({msg.get('ruleId', 'none')})"
            print(out.encode('utf-8', 'ignore').decode('utf-8', 'ignore'))
