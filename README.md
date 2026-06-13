# Brain Connectome 140 IBIS

A structured neuroanatomical coordinate map of the human brain, organized into **140 spatial points** across **76 brain structures**. The project is intended as a compact reference model for visualizing, teaching, comparing, and extending brain architecture in a clean coordinate-based format.

The model follows three major anatomical levels:

* **Cortical**
* **Subcortical**
* **Cerebellar**

The dataset is designed to represent major bilateral and midline brain structures in a way that is anatomically readable, computationally usable, and suitable for future visualization as a connectome-style brain map.

## Project Purpose

The goal of this repository is to create a clear and expandable anatomical dataset that can serve as a bridge between neuroscience, psychology, education, and data visualization.

The project can be used for:

* building a simplified 3D brain map;
* organizing brain structures by anatomical level;
* representing paired and unpaired structures as coordinate points;
* preparing educational materials on brain architecture;
* developing a symbolic or functional model of brain systems;
* future integration with Python, JavaScript, Three.js, Plotly, or other visualization tools.

## Dataset Logic

The model is based on the principle that anatomical brain structures can be represented as spatial points with structured metadata.

Each entry is expected to include several core fields:

| Field         | Meaning                                                           |
| ------------- | ----------------------------------------------------------------- |
| `Structure`   | Name of the anatomical brain structure                            |
| `Level`       | One of three anatomical levels: Cortical, Subcortical, Cerebellar |
| `Hemisphere`  | Left, Right, Midline, or Bilateral depending on the structure     |
| `X`           | Left-right spatial coordinate                                     |
| `Y`           | Anterior-posterior spatial coordinate                             |
| `Z`           | Inferior-superior spatial coordinate                              |
| `Voxels`      | Approximate volumetric or relative size value                     |
| `Description` | Short anatomical or functional description                        |

## Anatomical Levels

### Cortical

The cortical level includes structures of the cerebral cortex and major cortical regions. These structures are generally related to perception, voluntary action, language, abstraction, self-reflection, executive functions, and higher-order integration.

Examples may include frontal, parietal, temporal, occipital, insular, and cingulate cortical regions.

### Subcortical

The subcortical level includes deep brain structures, limbic regions, basal ganglia, thalamic structures, hypothalamic structures, brainstem nuclei, and major white matter pathways.

These structures are central for motivation, emotion, arousal, memory, reward, autonomic regulation, sensorimotor integration, and behavioral control.

Examples may include the thalamus, hypothalamus, amygdala, hippocampus, basal ganglia, nucleus accumbens, substantia nigra, VTA, locus coeruleus, raphe nuclei, habenula, septal nuclei, pons, medulla oblongata, corpus callosum, and fornix.

### Cerebellar

The cerebellar level includes cerebellar structures involved in motor coordination, timing, prediction, balance, procedural learning, and increasingly recognized cognitive-affective regulation.

Examples may include cerebellar hemispheres, vermis, deep cerebellar nuclei, and functional cerebellar subdivisions.

## Coordinate System

The coordinate system is intended as a simplified spatial representation rather than a clinical neuroimaging atlas.

General interpretation:

* `X` describes left-right lateralization;
* `Y` describes anterior-posterior position;
* `Z` describes inferior-superior position.

The coordinates should be understood as normalized or model-specific values. They are useful for visualization and conceptual mapping, but they should not be treated as direct MNI, Talairach, or clinical stereotactic coordinates unless explicitly converted and validated.

## Voxels

The `Voxels` field is intended to provide an approximate volumetric or relative size indicator for each structure.

Important note: voxel values should be interpreted cautiously. Brain structure volumes vary depending on atlas, segmentation method, MRI resolution, age, sex, clinical status, preprocessing pipeline, and definition of anatomical boundaries.

Therefore, the values in this project should be treated as educational and model-oriented unless a specific source atlas is documented.

## Current Status

This repository is at an early structural stage.

Planned or expected components:

* structured dataset of 140 brain points;
* 76 unique brain structures;
* classification into three anatomical levels;
* coordinate values for 3D visualization;
* voxel or relative-volume values;
* short descriptions for each structure;
* future scripts for validation and visualization.

## Suggested Repository Structure

```text
brain-connectome_140_IBIS/
├── README.md
├── data/
│   ├── brain_connectome_140.csv
│   ├── brain_connectome_140.xlsx
│   └── structures_metadata.csv
├── docs/
│   └── methodology.md
├── scripts/
│   ├── validate_dataset.py
│   └── visualize_3d.py
└── visualizations/
    └── brain_connectome_140.html
```

## Scientific Caution

This project is not a substitute for a validated neuroanatomical atlas. It is a structured educational and conceptual model.

For scientific, clinical, or publication-level use, the dataset should be checked against established neuroanatomical atlases and documentation standards, such as:

* MNI coordinate space;
* Talairach atlas;
* Harvard-Oxford atlas;
* AAL atlas;
* Brainnetome atlas;
* Allen Brain Atlas;
* FreeSurfer segmentation labels;
* FSL or Nilearn-compatible atlas definitions.

## Future Development

Potential next steps:

* add the full dataset in CSV and XLSX formats;
* document all sources and assumptions behind voxel estimates;
* separate paired and unpaired structures;
* add validation checks for structure count and point count;
* generate an interactive 3D visualization;
* create a browser-based anatomical explorer;
* add functional domains and network-level annotations;
* connect the dataset with psychological and cognitive models.

## Author

Created and maintained by **Borys Ivanenko**.
