"""
Local workaround, not a fix to the machine's environment.

This dev machine has a pre-existing `torchaudio` install (from an
unrelated project) that is version-mismatched with the CUDA 13.0 torch
build SANKET_ML needs (see Sanket_ML/README.md §5 / §Step 5). torchaudio
has no release yet compatible with torch 2.14, so its native extension
fails to load.

`transformers` (a sentence-transformers dependency) unconditionally
imports torchaudio as part of its multimodal auto-processing machinery,
even though our use here (a plain text embedding model) never touches
audio. Rather than uninstalling torchaudio system-wide — it may be used
by other projects on this machine — we stub it out only within this
process, only if the real import fails.

Import this before importing sentence_transformers/transformers.
"""

import importlib.machinery
import sys
import types


def ensure_importable():
    if "torchaudio" in sys.modules:
        return
    try:
        import torchaudio  # noqa: F401
    except Exception:
        stub = types.ModuleType("torchaudio")
        # Give it a real (if inert) spec — code that checks package
        # availability via importlib.util.find_spec() errors out on a
        # sys.modules entry whose __spec__ is None, so a bare
        # ModuleType isn't enough.
        stub.__spec__ = importlib.machinery.ModuleSpec("torchaudio", loader=None)
        sys.modules["torchaudio"] = stub
