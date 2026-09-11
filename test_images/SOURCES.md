# Test image sources

Real burn/wound photos used to manually verify `Sanket_ML/service`'s
`/predict` and `/guidance` endpoints against out-of-distribution input
(not part of the training data). All from Wikimedia Commons, which
requires every hosted file to carry a free-reuse license — used here for
non-commercial testing/education with attribution below.

| File | Source |
|---|---|
| `burn_hand_2nd_degree.jpg` | [Hand2ndburn.jpg](https://commons.wikimedia.org/wiki/File:Hand2ndburn.jpg) |
| `wound_leg_laceration.jpg` | [Cut, leg.jpg](https://commons.wikimedia.org/wiki/File:Cut,_leg.jpg) |
| `diabetic_heel_ulcer.jpg` | [Neuropathic_heel_ulcer_diabetic.jpg](https://commons.wikimedia.org/wiki/File:Neuropathic_heel_ulcer_diabetic.jpg) |
| `pressure_ulcer.jpg` | [Decubitus_ulcer_stage_4.jpg](https://commons.wikimedia.org/wiki/File:Decubitus_ulcer_stage_4.jpg) |
| `venous_ulcer.jpg` | [Venous_ulcer_dorsal_leg.jpg](https://commons.wikimedia.org/wiki/File:Venous_ulcer_dorsal_leg.jpg) |
| `surgical_incision.jpg` | [Open_incision.jpg](https://commons.wikimedia.org/wiki/File:Open_incision.jpg) |
| `hand_abrasion.jpg` | [Bicycle injury - Hand Abrasion, Day 1.jpg](https://commons.wikimedia.org/wiki/File:Bicycle_injury_-_Hand_Abrasion,_Day_1.jpg) |
| `elbow_bruise.jpg` | [Bruise_on_elbow.jpg](https://commons.wikimedia.org/wiki/File:Bruise_on_elbow.jpg) |
| `finger_cut.jpg` | [Finger_cut.jpg](https://commons.wikimedia.org/wiki/File:Finger_cut.jpg) |

## Quick test

```powershell
cd Sanket_ML
python inference.py --image ..\test_images\burn_hand_2nd_degree.jpg --model burn
python inference.py --image ..\test_images\wound_leg_laceration.jpg --model wound
```

Or against the running service — see `Sanket_ML/README.md §15`.
