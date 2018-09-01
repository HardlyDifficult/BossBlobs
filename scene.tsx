import * as DCL from 'metaverse-api'
import { Blob, IBlobProps } from "components/Blob";
import { Chest, IChestProps, ChestState } from 'components/Chest';
import { Vector3Component } from 'metaverse-api';
import { Message } from 'components/Message';
import { Ground } from 'components/Ground';

export function sleep(ms: number): Promise<void> 
{
	return new Promise(resolve => setTimeout(resolve, ms));
}

let objectCount = 0;

export default class SampleScene extends DCL.ScriptableScene 
{
  blobSpawnTimeout?: NodeJS.Timer; // how-to prevent multiple spawns
  nextSpawnTime?: Date; // shared
  blobAnimationLerp?: NodeJS.Timer; 
  messageTimeout?: NodeJS.Timer;

  state: {
    blob?: IBlobProps, // how-to deal with multiple movers?
    chest: IChestProps, // activate for all then individual states to redeem
    message?: string,
    playerPosition: Vector3Component,
  } = {
    chest: {
      position: {x: 5, y: 0, z: 9},
      rotation: {x: 0, y: 0, z: 0},
      chestState: ChestState.Empty,
      animationWeight: 1,
    },
    playerPosition: {x: 0, y: 0, z: 0},
  };

  sceneDidMount()
  {
    this.spawnBlob();
    this.eventSubscriber.on("Chest_click", () => this.onChestClick());
    this.subscribeTo("positionChanged", (e) =>
    {
      this.setState({playerPosition: e.position})
    });
  }
  sceneDidUpdate()
  {
    // upload changes
  }

  async onBlobClick()
  {
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
    await sleep(2000);
    this.setState({blob: undefined});
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
      const timeTillNextSpawn = 3000;
      this.nextSpawnTime = new Date(Date.now());
      this.nextSpawnTime.setMilliseconds(this.nextSpawnTime.getMilliseconds() + timeTillNextSpawn);
      await sleep(timeTillNextSpawn);
      this.spawnBlob();
    }
    else // empty 
    {
      if(this.nextSpawnTime)
      {
        const timeTillNextSpawn = this.nextSpawnTime.getSeconds() - new Date(Date.now()).getSeconds();
        this.showMessage("Next spawn in " + timeTillNextSpawn); 
      }
    }
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

  async showMessage(message: string, duration: number = 3000)
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
    this.setState({blob: {
      id: objectCount++,
      position: {x: 5, y: 0, z: 5},
      rotation: {x: 0, y: 0, z: 0},
      isDead: false,
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
      this.setState({blob: this.state.blob});

      await sleep(1000);
    }
  }

  positionIsValid(position: Vector3Component): boolean
  {
    if(position.x < 1 || position.x > 9 || position.z < 1 || position.z > 9)
    { // In bounds
      return false;
    }

    if(Math.abs(position.x - this.state.chest.position.x) <= 2 && Math.abs(position.z - this.state.chest.position.z) <= 2)
    { // Not on-top of the chest
      return false;
    }

    return true;
  }

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
