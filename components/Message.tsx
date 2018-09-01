import * as DCL from 'metaverse-api'
import { Vector3Component } from 'metaverse-api';

export interface IMessageProps
{
  position: Vector3Component,
  message: string,
}

export const Message = (props: IMessageProps) =>
{
  if(!props.message)
  {
    return;
  }
	return (
    <entity 
      position={{x: 0, y: 2.2, z: 0}}
    >
      <entity
        position={props.position}
        billboard={7}
        transition={{position: {duration: 250, timing: 'ease-in'}}}
      >
        <entity
          rotation={{x: 0, y: 270, z: 0}}
        >
          <text
            id="Message"
            value={props.message}
            position={{x: 2, y: 0, z: 0}}
            rotation={{x: 0, y: 90, z: 0}}
            width={2}
            color="#880000"
          />
        </entity>
      </entity>
    </entity>
	)
}