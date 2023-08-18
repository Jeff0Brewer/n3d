# N3D
NASA/IPAC Extragalactic Data 3d Visualization Tool

## Camera Control Menu
The camera menu can be used to set and loop through static camera paths.
By default, the camera menu will be hidden, press `ctrl + m` to toggle visibility.

#### Intersection Points
<p align="center">
  <img src="https://github.com/Jeff0Brewer/readme-img/blob/main/n3d/intersect-inputs.jpg?raw=true" alt="intersection inputs"/>
</p>

`x`, `y`, `z`, positions for 3 points the camera should pass through, `P0`, `P1`, `P2`
- the camera path starts at `P0`, passes through `P1`, and ends at `P2`
- positions in the dataset are mostly in the range `(-5, 5)` in `x`, `y`, `z`,
so camera paths should be close to this range

#### Duration
<p align="center">
  <img src="https://github.com/Jeff0Brewer/readme-img/blob/main/n3d/duration-input.jpg?raw=true" alt="duration input"/>
</p>

`duration` input, determining how many seconds the camera path should take to travel
- shorter durations for faster camera movement

#### Focal Point
<p align="center">
  <img src="https://github.com/Jeff0Brewer/readme-img/blob/main/n3d/focus-input.jpg?raw=true" alt="focus input"/>
</p>

`focus` input, position in `x`, `y`, `z` for camera focal point
- `add focus` / `remove focus` buttons will toggle 'focus' input visibility
- when inactive, camera will always look forwards in the direction of travel
- when active, camera will always look at the focal point's `x`, `y`, `z` position
