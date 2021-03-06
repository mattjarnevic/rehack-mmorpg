class BootScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'BootScene',
      active: true
    });
  }

  preload() {
    // joystick
    const url = 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js';
    this.load.plugin('rexvirtualjoystickplugin', url, true);
    // map tiles
    // this.load.image('tiles', 'assets/map/grass.png')
    this.load.image('tiles', 'assets/map/Atlas.png')

    this.load.image('gamepad', 'assets/map/gamepad_spritesheet.png')

    this.load.audio("westworld", ["assets/map/westworld.mp3"]);

    // vision gradient
    this.load.image('vision', 'assets/map/vision.png')

    // map in json format
    // this.load.tilemapTiledJSON('tilemap', 'assets/map/tilemap.json')
    this.load.tilemapTiledJSON('tilemap', 'assets/map/west.json')

    // our two characters
    this.load.spritesheet('player', 'assets/RPG_assets.png', {
      frameWidth: 16,
      frameHeight: 16
    });

    this.load.image('golem', 'assets/images/coppergolem.png');
    this.load.image('ent', 'assets/images/dark-ent.png');
    this.load.image('demon', 'assets/images/demon.png');
    this.load.image('worm', 'assets/images/giant-worm.png');
    this.load.image('wolf', 'assets/images/wolf.png');
    this.load.image('sword', 'assets/images/attack-icon.png');
  }

  create() {
    this.music = this.sound.add("westworld", { loop: true });
    this.music.play();
    this.scene.start('WorldScene');
  }
}

class WorldScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'WorldScene'
    });
  }

  create() {
    this.socket = io();
    this.otherPlayers = this.physics.add.group();

    // create map
    this.createMap();

    // create player animations
    this.createAnimations();

    // joystick
    this.joyStick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
      x: 80,
      y: 400,
      radius: 50,
      base: this.add.circle(0, 0, 50, 0x888888),
      thumb: this.add.circle(0, 0, 15, 0xcccccc),
      dir: '8dir',   // 'up&down'|0|'left&right'|1|'4dir'|2|'8dir'|3
      forceMin: 8,
      enable: true
  });

    // user input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
  }

    // create enemies
    this.createEnemies();

    // listen for web socket events
    this.socket.on('currentPlayers', function (players) {
      Object.keys(players).forEach(function (id) {
        if (players[id].playerId === this.socket.id) {
          this.createPlayer(players[id]);
        } else {
          this.addOtherPlayers(players[id]);
        }
      }.bind(this));
    }.bind(this));

    this.socket.on('newPlayer', function (playerInfo) {
      this.addOtherPlayers(playerInfo);
    }.bind(this));

    this.socket.on('disconnect', function (playerId) {
      this.otherPlayers.getChildren().forEach(function (player) {
        if (playerId === player.playerId) {
          player.destroy();
        }
      }.bind(this));
    }.bind(this));

    this.socket.on('playerMoved', function (playerInfo) {
      this.otherPlayers.getChildren().forEach(function (player) {
        if (playerInfo.playerId === player.playerId) {
          player.flipX = playerInfo.flipX;
          player.setPosition(playerInfo.x, playerInfo.y);
        }
      }.bind(this));
    }.bind(this));
  }

  // createMap() {
  //   // create the map
  //   this.map = this.make.tilemap({
  //     key: 'map'
  //   });

  //   // first parameter is the name of the tilemap in tiled
  //   var tiles = this.map.addTilesetImage('spritesheet', 'tiles');

  //   // creating the layers
  //   this.map.createStaticLayer('Grass', tiles);
  //   this.map.createStaticLayer('Obstacles', tiles);

  //   // don't go out of the map
  //   this.physics.world.bounds.width = this.map.widthInPixels;
  //   this.physics.world.bounds.height = this.map.heightInPixels;
  // }

  createMap() {
    this.map = this.make.tilemap({ key: 'tilemap' })
		const tileset = this.map.addTilesetImage('tileset', 'tiles')

		const groundLayer = this.map.createStaticLayer('Ground', tileset)
		var buildingsLayer = this.map.createStaticLayer('Buildings', tileset)

    const width = this.scale.width
    const height = this.scale.height

    // make a RenderTexture that is the size of the screen
    this.rt = this.make.renderTexture({
      width: this.scale.canvasBounds.width,
      height: this.scale.canvasBounds.height
    }, true)

    // fill it with black
    this.rt.fill(0x000000, 1)

    // draw the floorLayer into it
    this.rt.draw(groundLayer)
    // rt.draw(buildingsLayer)

    // set a dark blue tint
    this.rt.setTint(0x0a2948)

    // don't go out of the map
    this.physics.world.bounds.width = this.map.widthInPixels;
    this.physics.world.bounds.height = this.map.heightInPixels;
  }

  createAnimations() {
    //  animation with key 'left', we don't need left and right as we will use one and flip the sprite
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('player', {
        frames: [1, 7, 1, 13]
      }),
      frameRate: 10,
      repeat: -1
    });

    // animation with key 'right'
    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('player', {
        frames: [1, 7, 1, 13]
      }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'up',
      frames: this.anims.generateFrameNumbers('player', {
        frames: [2, 8, 2, 14]
      }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'down',
      frames: this.anims.generateFrameNumbers('player', {
        frames: [0, 6, 0, 12]
      }),
      frameRate: 10,
      repeat: -1
    });
  }

  createPlayer(playerInfo) {
    // our player sprite created through the physics system
    this.player = this.add.sprite(0, 0, 'player', 6);

    this.container = this.add.container(playerInfo.x, playerInfo.y);
    this.container.setSize(16, 16);
    this.physics.world.enable(this.container);
    this.container.add(this.player);

    // add weapon
    this.weapon = this.add.sprite(10, 0, 'sword');
    this.weapon.setScale(0.5);
    this.weapon.setSize(8, 8);
    this.physics.world.enable(this.weapon);

    this.container.add(this.weapon);
    this.attacking = false;

    // update camera
    this.updateCamera();

    // don't go out of the map
    this.container.body.setCollideWorldBounds(true);

    this.physics.add.collider(this.container, this.spawns);

    this.physics.add.overlap(this.weapon, this.spawns, this.onMeetEnemy, false, this);

    this.vision = this.make.image({
      x: playerInfo.x,
      y: playerInfo.y,
      key: 'vision',
      add: false
    })

    this.vision.scale = 0.1

    this.rt.mask = new Phaser.Display.Masks.BitmapMask(this, this.vision)
    // this.rt.mask.invertAlpha = true
  }

  addOtherPlayers(playerInfo) {
    const otherPlayer = this.add.sprite(playerInfo.x, playerInfo.y, 'player', 9);
    otherPlayer.setTint(Math.random() * 0xffffff);
    otherPlayer.playerId = playerInfo.playerId;
    this.otherPlayers.add(otherPlayer);
  }

  updateCamera() {
    // limit camera to map
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.container);
    this.cameras.main.roundPixels = true; // avoid tile bleed
  }

  createEnemies() {
    // where the enemies will be
    this.spawns = this.physics.add.group({
      classType: Phaser.GameObjects.Sprite
    });
    for (var i = 0; i < 20; i++) {
      const location = this.getValidLocation();
      // parameters are x, y, width, height
      var enemy = this.spawns.create(location.x, location.y, this.getEnemySprite());
      enemy.body.setCollideWorldBounds(true);
      enemy.body.setImmovable();
    }
    // move enemies
    this.timedEvent = this.time.addEvent({
      delay: 3000,
      callback: this.moveEnemies,
      callbackScope: this,
      loop: true
    });
  }

  moveEnemies () {
    this.spawns.getChildren().forEach((enemy) => {
      const randNumber = Math.floor((Math.random() * 4) + 1);

      switch(randNumber) {
        case 1:
          enemy.body.setVelocityX(50);
          break;
        case 2:
          enemy.body.setVelocityX(-50);
          break;
        case 3:
          enemy.body.setVelocityY(50);
          break;
        case 4:
          enemy.body.setVelocityY(50);
          break;
        default:
          enemy.body.setVelocityX(50);
      }
    });

    setTimeout(() => {
      this.spawns.setVelocityX(0);
      this.spawns.setVelocityY(0);
    }, 500);
  }

  getEnemySprite() {
    var sprites = ['golem', 'ent', 'demon', 'worm', 'wolf'];
    return sprites[Math.floor(Math.random() * sprites.length)];
  }

  getValidLocation() {
    var validLocation = false;
    var x, y;
    while (!validLocation) {
      x = Phaser.Math.RND.between(0, this.physics.world.bounds.width);
      y = Phaser.Math.RND.between(0, this.physics.world.bounds.height);

      var occupied = false;
      this.spawns.getChildren().forEach((child) => {
        if (child.getBounds().contains(x, y)) {
          occupied = true;
        }
      });
      if (!occupied) validLocation = true;
    }
    return { x, y };
  }

  onMeetEnemy(player, enemy) {
    if (this.attacking) {
      const location = this.getValidLocation();
      enemy.x = location.x;
      enemy.y = location.y;
    }
  }

  update() {
    if (this.container) {
      this.container.body.setVelocity(0);

      if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && !this.attacking) {
        this.attacking = true;
      }
      else {
        this.attacking = false;
      }

      // Read joystick data to set ship's angle and acceleration
      // if (this.joystick.properties.inUse) {
      //   this.player.angle = this.joystick.properties.angle;
      //   this.player.lastAngle = this.player.angle;
      // } else {
      //     this.player.angle = this.player.lastAngle;
      // }
      // this.player.body.acceleration.x = 4 * this.joystick.properties.x;
      // this.player.body.acceleration.y = 4 * this.joystick.properties.y;

      // Horizontal movement
      if (this.cursors.left.isDown || this.wasd.left.isDown || this.joyStick.left) {
        this.container.body.setVelocityX(-80);
      } else if (this.cursors.right.isDown || this.wasd.right.isDown || this.joyStick.right) {
        this.container.body.setVelocityX(80);
      }

      // Vertical movement
      if (this.cursors.up.isDown || this.wasd.up.isDown || this.joyStick.up) {
        this.container.body.setVelocityY(-80);
      } else if (this.cursors.down.isDown || this.wasd.down.isDown || this.joyStick.down) {
        this.container.body.setVelocityY(80);
      }

      // Update the animation last and give left/right animations precedence over up/down animations
      if (this.cursors.left.isDown || this.wasd.left.isDown || this.joyStick.left) {
        this.player.anims.play('left', true);
        this.player.flipX = true;
      } else if (this.cursors.right.isDown || this.wasd.right.isDown || this.joyStick.right) {
        this.player.anims.play('right', true);
        this.player.flipX = false;
      } else if (this.cursors.up.isDown || this.wasd.up.isDown || this.joyStick.up) {
        this.player.anims.play('up', true);
      } else if (this.cursors.down.isDown || this.wasd.down.isDown || this.joyStick.down) {
        this.player.anims.play('down', true);
      } else {
        this.player.anims.stop();
      }

      // emit player movement
      var x = this.container.x;
      var y = this.container.y;
      var flipX = this.player.flipX;
      if (this.container.oldPosition && (x !== this.container.oldPosition.x || y !== this.container.oldPosition.y || flipX !== this.container.oldPosition.flipX)) {
        this.socket.emit('playerMovement', { x, y, flipX });
      }
      // save old position data
      this.container.oldPosition = {
        x: this.container.x,
        y: this.container.y,
        flipX: this.player.flipX
      };

      if (this.vision)
      {
        this.vision.x = this.container.x
        this.vision.y = this.container.y
      }
    }
  }
}

var config = {
  type: Phaser.AUTO,
  parent: 'content',
  width: 640,
  height: 480,
  zoom: 3,
  pixelArt: true,
  scale: {
    pageAlignHorizontally: true,
    pageAlignVertically: true,
    mode: Phaser.Scale.SHOW_ALL,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {
        y: 0
      },
      debug: false // set to true to view zones
    }
  },
  scene: [
    BootScene,
    WorldScene
  ]
};
var game = new Phaser.Game(config);
