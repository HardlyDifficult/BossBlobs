const Gun = require('gun');
import { Vector3Component } from 'metaverse-api';

export namespace GunDB
{
  const gun = Gun("https://dcl-gun.herokuapp.com/gun");

  export function init(
    onBlobUpdated: (blob?: {position: Vector3Component, lastChanged: Date}) => void,
    onNextSpawnStarted: (nextSpawn: Date) => void)
  {
    gun.get("bossblobs").get("blob").on((data: any) =>
    {
      if(data)
      { 
        onBlobUpdated({
          position: JSON.parse(data.position), 
          lastChanged: new Date(data.lastChanged)
        });
      }
      else
      {
        onBlobUpdated();
      }
    });

    gun.get("bossblobs").get("nextspawntime").on((data: any) =>
    {
      if(data)
      {
        onNextSpawnStarted(new Date(data));
      }
    });
  }

  export function setBlobPosition(position: Vector3Component)
  {
    gun.get("bossblobs").get("blob").put({
      position: JSON.stringify(position),
      lastChanged: Date.now(),
    });
  }

  export function killBlob()
  {
    gun.get("bossblobs").get("blob").put(null);
    gun.get("bossblobs").get("nextspawntime").put(null);
  }

  export function startSpawnCountdown(nextSpawnTime: Date)
  {
    gun.get("bossblobs").get("nextspawntime").once((data: any) => 
    {
      if(!data)
      {
        gun.get("bossblobs").get("nextspawntime").put(nextSpawnTime.toString());
      }
    });
  }
}