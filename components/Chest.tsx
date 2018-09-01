import * as DCL from 'metaverse-api'
import { Vector3Component } from 'metaverse-api';

export enum ChestState
{
	Empty,
	Full,
	Open,
	OpenEmpty,
}

export interface IChestProps
{
  position: Vector3Component,
	rotation: Vector3Component,
	chestState: ChestState,
	animationWeight: number,
}

export const Chest = (props: IChestProps) =>
{
	let openWeight = 0;
	let openEmptyWeight = 0;
	let emptyWeight = 0;
	let fullWeight = 0;
	switch(props.chestState)
	{
		case ChestState.Empty:
			emptyWeight = props.animationWeight;
			openEmptyWeight = 1 - props.animationWeight;
			break;
		case ChestState.Full:
			fullWeight = props.animationWeight;
			emptyWeight = 1 - props.animationWeight;
			break;
		case ChestState.Open:
			openWeight = props.animationWeight;
			fullWeight = 1 - props.animationWeight;
			break;
		case ChestState.OpenEmpty:
			openEmptyWeight = props.animationWeight;
			openWeight = 1 - props.animationWeight;
			break;
	}

	return (
		<entity
			position={props.position}
			rotation={props.rotation}
		>
			<gltf-model
				id="Chest"
				src="assets/GoldChest.gltf"
				skeletalAnimation={[
					{
						clip: "Closed_Empty",
						weight: emptyWeight
					},
					{
						clip: "Open_Full",
						weight: openWeight
					},
					{
						clip: "Open_Empty",
						weight: openEmptyWeight
					},
					{
						clip: "DancingChest",
						weight: fullWeight
					},
				]}
			/>
		</entity>
	)
}
