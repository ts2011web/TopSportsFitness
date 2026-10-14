"""One-time source import, preserving this repository's reviewed live changes."""
from pathlib import Path
import shutil

source=Path('_legacy').resolve()
target=Path.cwd().resolve()
if source.parent != target or not (source/'package.json').is_file():
    raise SystemExit('Expected legacy source checkout is missing')
for path in source.rglob('*'):
    relative=path.relative_to(source)
    if relative.parts[0] in ('.git','.github') or not path.is_file():
        continue
    destination=target/relative
    if not destination.exists():
        destination.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(path,destination)
shutil.rmtree(source)
