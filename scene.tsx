import * as DCL from 'metaverse-api'
import { Blob, IBlobProps } from "components/Blob";
import { Chest, IChestProps, ChestState } from 'components/Chest';
import { Vector3Component } from 'metaverse-api';
import { Message } from 'components/Message';
import { Ground } from 'components/Ground';
import { GunDB } from 'GunDB';
import { setInterval, clearInterval, setTimeout, clearTimeout } from 'timers';


// TODO text does not work up high

export function sleep(ms: number): Promise<void> 
{
	return new Promise(resolve => setTimeout(resolve, ms));
}

let objectCount = 0;

export default class SampleScene extends DCL.ScriptableScene 
{
  blobSpawnTimeout?: NodeJS.Timer; 
  nextSpawnTime?: Date; 
  blobAnimationLerp?: NodeJS.Timer; 
  messageTimeout?: NodeJS.Timer;

  state: {
    blob?: IBlobProps, 
    chest: IChestProps, 
    message?: string,
    playerPosition: Vector3Component,
  } = {
    chest: {
      position: {x: 10, y: 0, z: 19},
      rotation: {x: 0, y: 0, z: 0},
      chestState: ChestState.Empty,
      animationWeight: 1,
    },
    playerPosition: {x: 0, y: 0, z: 0},
  };

  // Init
  sceneDidMount()
  {
    this.eventSubscriber.on("Chest_click", () => this.onChestClick());
    this.subscribeTo("positionChanged", (e) =>
    {
      this.setState({playerPosition: e.position})
    });

    GunDB.init((blob) => this.onBlobUpdated(blob), (nextSpawn) => this.onNextSpawnStarted(nextSpawn));
  }

  // Events
  async onBlobClick()
  {
    GunDB.killBlob();
    await this.killBlob();
  }
  
  async onChestClick()
  {
    if(this.state.chest.chestState == ChestState.Full)
    {
      this.setChestState(ChestState.Open);
    }
    else if(this.state.chest.chestState == ChestState.Open)
    {
      this.setChestState(ChestState.OpenEmpty);
      this.showMessage("+100 Gold");
    }
    else if(this.state.chest.chestState == ChestState.OpenEmpty)
    {
      this.setChestState(ChestState.Empty);
    }
    else if(!this.state.blob)
    {
      if(!this.nextSpawnTime || this.nextSpawnTime.getTime() <= Date.now())
      {
        const timeTillNextSpawn = 15000;
        this.nextSpawnTime = new Date(Date.now());
        this.nextSpawnTime.setMilliseconds(this.nextSpawnTime.getMilliseconds() + timeTillNextSpawn);
        GunDB.startSpawnCountdown(this.nextSpawnTime);
      }
      if(this.nextSpawnTime)
      {
        const timeTillNextSpawn = this.nextSpawnTime.getTime() - new Date(Date.now()).getTime();
        this.showMessage("Next spawn in " + Math.round(timeTillNextSpawn / 1000)); 
      }
    }
  }
  async onBlobUpdated(blob?: {position: Vector3Component, lastChanged: Date})
  {
    if(this.state.blob && blob)
    {
      this.state.blob.position = blob.position;
      this.state.blob.lastChanged = blob.lastChanged;
      this.setState({blob: this.state.blob});
    }
    else if(blob)
    {
      this.spawnBlob();
    }
    else if(this.state.blob)
    { // Destroy blob
      await this.killBlob(); 
    }
  }

  async onNextSpawnStarted(nextSpawnTime: Date)
  {
    this.startSpawnCountdown(nextSpawnTime);
  }
  
  // Helpers
  async killBlob()
  {
    if(this.blobSpawnTimeout)
    {
      clearTimeout(this.blobSpawnTimeout);
    }
    this.nextSpawnTime = undefined;
    this.state.chest.chestState = ChestState.Full;
    if(this.state.blob)
    {
      this.state.blob.isDead = true;
      this.eventSubscriber.off("Blob" + this.state.blob.id + "_click");
    }
    this.setState({blob: this.state.blob, chest: this.state.chest});
    if(this.blobAnimationLerp)
    {
      clearInterval(this.blobAnimationLerp);
    }
    if(this.blobSpawnTimeout)
    {
      clearInterval(this.blobSpawnTimeout);
    }
    this.blobSpawnTimeout = setTimeout(() => 
    {
      this.setState({blob: undefined});
    }, 2000);
  }

  async startSpawnCountdown(nextSpawnTime: Date)
  {
    this.nextSpawnTime = nextSpawnTime;
    const timeTillNextSpawn = nextSpawnTime.getTime() - Date.now();
    if(this.blobSpawnTimeout)
    {
      clearTimeout(this.blobSpawnTimeout);
    }
    this.blobSpawnTimeout = setTimeout(() => this.spawnBlob(), timeTillNextSpawn);
  }

  setChestState(state: ChestState)
  {
    this.state.chest.chestState = state;
    this.state.chest.animationWeight = 0;
    this.setState({chest: this.state.chest});
    if(this.blobAnimationLerp)
    {
      clearInterval(this.blobAnimationLerp);
    }

    if(state == ChestState.OpenEmpty)
    {
      this.state.chest.animationWeight = 1;
      this.setState({chest: this.state.chest});
    }
    else
    {
      this.blobAnimationLerp = setInterval(() =>
      {
        this.state.chest.animationWeight += .01;
        if(this.state.chest.animationWeight >= 1)
        {
          this.state.chest.animationWeight = 1;
          if(this.blobAnimationLerp)
          {  
            clearInterval(this.blobAnimationLerp);
          }
        }
        this.setState({chest: this.state.chest});
      }, 1000 / 60);
    }
  }

  async showMessage(message: string, duration: number = 1500)
  {
    if(this.messageTimeout)
    {
      clearTimeout(this.messageTimeout);
    }

    this.setState({message});
    this.messageTimeout = setTimeout(() =>
    {
      this.setState({message: undefined});
    }, duration);
  }

  spawnBlob()
  {
    if(this.state.blob)
    { // We already have one
      return;
    }
    if(this.blobSpawnTimeout)
    {
      clearTimeout(this.blobSpawnTimeout);
    }

    this.setState({blob: {
      id: objectCount++,
      position: {x: 10, y: 0, z: 18},
      rotation: {x: 0, y: 0, z: 0},
      isDead: false,
      lastChanged: new Date()
    }});
    if(this.state.blob)
    {
      this.eventSubscriber.on("Blob" + this.state.blob.id + "_click", () => this.onBlobClick());
    }
    this.blobWalk();
  }

  async blobWalk()
  {
    while(this.state.blob && !this.state.blob.isDead)
    {
      if(Date.now() - this.state.blob.lastChanged.getDate() > 1000)
      {
        let target;
        do
        {
          target = JSON.parse(JSON.stringify(this.state.blob.position));
          switch(Math.floor(Math.random() * 4))
          { // Pick a random direction
            case 0:
              target.x++;
              break;
            case 1:
              target.x--;
              break;
            case 2:
              target.z++;
              break;
            default:
              target.z--;
              break;
          }
        } while(!this.positionIsValid(target));

        this.state.blob.position = target;
        this.state.blob.lastChanged = new Date(Date.now());
        this.setState({blob: this.state.blob});
        GunDB.setBlobPosition(target);
      }
      await sleep(1000);
    }
  }

  positionIsValid(position: Vector3Component): boolean
  {
    if(position.x < 1 || position.x > 19 || position.z < 1 || position.z > 19)
    { // In bounds
      return false;
    }

    if(Math.abs(position.x - this.state.chest.position.x) <= 2 && Math.abs(position.z - this.state.chest.position.z) <= 1)
    { // Not on-top of the chest
      return false;
    }

    return true;
  }

  // Render
  renderBlob()
  {
    if(this.state.blob)
    {
      return Blob(this.state.blob);
    }
  }
  renderMessage()
  {
    if(this.state.message && this.positionIsValid(this.state.playerPosition))
    {
      return Message({message: this.state.message, position: this.state.playerPosition});
    }
  }

  async render() 
  {
    return (
      <scene>
        
        {this.renderBlob()}
        {Chest(this.state.chest)}
        {this.renderMessage()}
        {Ground()}
      </scene>
    )
  }
}