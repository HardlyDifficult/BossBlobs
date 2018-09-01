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
				position={{x: 5, y: 0, z: 5}}
				rotation={{x: 90, y: 0, z: 0}}
				scale={9.99}
			/>
		</entity>
	)
}