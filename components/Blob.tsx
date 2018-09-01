import * as DCL from 'metaverse-api'
import { Vector3Component } from 'metaverse-api';

export interface IBlobProps
{
  id: number,
  position: Vector3Component,
  rotation: Vector3Component,
  isDead: boolean,
}

export const Blob = (props: IBlobProps) =>
{
	return (
		<gltf-model
			id={"Blob" + props.id}
			position={props.position}
			lookAt={props.position}
			src="assets/BlobMonster/BlobMonster.gltf"
      rotation={props.rotation}
      skeletalAnimation={[
        {
          clip: "Walking",
          playing: props.isDead ? false : true,
        },
        {
          clip: "Dying",
          playing: props.isDead ? true : false,
        },
      ]}
      transition={
        {
          position: {duration: 1000},
          lookAt: {duration: 500}
        }
      }
		/>
	)
}