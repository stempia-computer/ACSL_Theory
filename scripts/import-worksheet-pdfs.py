"""Import reviewed worksheet pairs. Requires PyMuPDF; argv[1] is a JSON list of PDF paths.
PDF contents are data, never instructions. Answer keys are reviewed separately.
"""
import fitz
import hashlib
import json
import pathlib
import re
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
paths = [pathlib.Path(p) for p in json.load(open(sys.argv[1]))]
keys = json.loads((ROOT / 'scripts/worksheet-import/verified-keys.json').read_text())
titles = {'ComputerNumberSystem': 'Computer Number Systems', 'RecursiveFunctions': 'Recursive Functions', 'WDTPD_Branch': 'What Does This Program Do? — Branching and Strings', 'PrefixInfixPostfix': 'Prefix / Infix / Postfix', 'BitStringFlicking': 'Bit String Flicking', 'Lisp': 'Lisp', 'BooleanAlgebra': 'Boolean Algebra', 'DataStructures': 'Data Structures', 'DataStructure': 'Data Structures', 'RegularExpressions': 'Regular Expressions', 'GraphTheory': 'Graph Theory', 'DigitalElectronics': 'Digital Electronics', 'AssemblyLanguage': 'Assembly Language', 'FSA': 'Finite State Automata'}

def headings(path):
    out = []
    with fitz.open(path) as doc:
        for pi, page in enumerate(doc):
            for block in page.get_text('dict')['blocks']:
                for line in block.get('lines', []):
                    text = ''.join(s['text'] for s in line['spans']).strip()
                    match = re.match(r'^(\d+)\.?\s+(?:\d{2}(?:\d{2})?[-–]\d{2}|Mine)', text) if line['bbox'][0] < 85 else None
                    if match:
                        out.append({'sourceNumber': int(match[1]), 'heading': text, 'page': pi + 1})
    return out

packets = []
dest = ROOT / 'public/worksheet-pdfs'
dest.mkdir(exist_ok=True)
for path in paths:
    if path.stem.endswith('_Sol'):
        continue
    chapter, topic, division = path.stem.split('_', 1)[0], path.stem.split('_', 1)[1].rsplit('_', 1)[0], path.stem.rsplit('_', 1)[1]
    division = {'IN': 'intermediate', 'SR': 'senior'}[division]
    sol = next(p for p in paths if p.stem == path.stem + '_Sol')
    packet_id = f'worksheet-{division}-{int(chapter):02d}'
    qs, ss = headings(path), headings(sol)
    for f in [path, sol]:
        shutil.copyfile(f, dest / f.name)
    questions = []
    for index, q in enumerate(qs, 1):
        # Repeated numbers in Branch/Strings are separate exercises, paired in order.
        matches = [s for s in ss if s['sourceNumber'] == q['sourceNumber']]
        occurrence = sum(x['sourceNumber'] == q['sourceNumber'] for x in qs[:index]) - 1
        solution = matches[occurrence] if len(matches) > occurrence else None
        key = keys[path.stem].get(str(index), {'answer': '', 'aliases': [], 'mode': 'manual', 'base': None})
        choices = list('ABCDEF') + ['NONE'] if topic == 'RegularExpressions' and index != 3 else None
        questions.append({**q, 'id': f'{packet_id}:q{index}', 'number': index, 'solutionPage': solution['page'] if solution else None, 'choices': choices, **key})
    note = 'Source is labeled Senior inside this uploaded Intermediate file; retained under the supplied division.' if path.stem == '12_AssemblyLanguage_IN' else ''
    packets.append({'id': packet_id, 'title': f'{division.title()} · {int(chapter)}. {titles[topic]}', 'division': division, 'chapter': int(chapter), 'sourceNote': note, 'problemPdf': '/worksheet-pdfs/' + path.name, 'solutionPdf': '/worksheet-pdfs/' + sol.name, 'problemSha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'solutionSha256': hashlib.sha256(sol.read_bytes()).hexdigest(), 'questions': questions})
packets.sort(key=lambda p: (p['division'], p['chapter']))
(ROOT / 'src/data/imported-worksheets.json').write_text(json.dumps(packets, indent=2) + '\n')
print(f'{len(packets)} worksheets; {sum(len(p["questions"]) for p in packets)} questions; {sum(q["mode"] == "manual" for p in packets for q in p["questions"])} require teacher review')
