import * as DCL from 'metaverse-api'

const roughness: number = 1;

export const Ground = () =>
{
	return (
		<entity>
			<material
				id="groundMat"
				albedoTexture="assets/TestGrass.png"
				roughness={roughness}
			/>
			<plane
				id="Ground"
				material="#groundMat"
				position={{x: 10, y: 0, z: 10}}
				rotation={{x: 90, y: 0, z: 0}}
				scale={19.99}
			/>
		</entity>
	)
}