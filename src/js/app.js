/**
 * Welcome to MPD-Player!
 *
 * This is where you write your app.
 */
var UI = require('ui');
var Vector2 = require('vector2');
var Vibe = require('ui/vibe');
var Mopidy = require("mopidy");
var Settings = require('settings');

Settings.config(
  { url: 'http://bkbilly.github.io/Mopidy-Player-Config/' },
  function(e) {
    console.log('opening configurable');
  },
  function(e) {
    console.log('closed configurable');
    console.log(JSON.stringify(e.options));
    Settings.option(e.options);
    connectToMopidy();
  }
);
var ConnectionErrorMessage = new UI.Card({
  title: "connecting to",
  body: 'Check that you have access to this url:',
  scrollable: true
});
var ErrorMessage = new UI.Card({
  title: "Can't Connect to Mopidy",
  body: 'Check if you are on the same Network and the Configuration is correct',
  scrollable: true
});
var NoConfigMessage = new UI.Card({
  title: "Configuration is Undefined",
  body: 'Edit the the Configuration',
  scrollable: true
});

var ConnectionErrorMessageSHOWED = true;
var NoConfigMessageSHOWED = false;
var ErrorMessageSHOWED = false;
var mainMenuSHOWED = false;
var mopidy;
connectToMopidy();



function msToTime(s) {

  function addZ(n) {
    return (n<10? '0':'') + n;
  }

  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;

  if (hrs === 0) {
    return addZ(mins) + ':' + addZ(secs);
  } else {
    return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs);
  }
}

function connectToMopidy(){
  var makeConnection = function(myServer){
    console.log(myServer);
    ConnectionErrorMessage.body(myServer);
    ConnectionErrorMessage.show();
    mopidy = new Mopidy({webSocketUrl: myServer});

    mopidy.connect();
    mopidy.on("state:online", function() {
      console.log("Mopidy is Online");
      ConnectionErrorMessageSHOWED = false;
      NoConfigMessageSHOWED = false;
      ErrorMessageSHOWED = false;
      ConnectionErrorMessage.hide();
      NoConfigMessage.hide();
      ErrorMessage.hide();
      MainMenuFunction();
    });
    mopidy.on("state:offline", function() {
      console.log("Mopidy is Offline");
      if(!ErrorMessageSHOWED)
        ErrorMessage.show();
      ErrorMessageSHOWED = true;
    });
    mopidy.on("websocket:error", function() {
      console.log("can't connect");
      if(!ConnectionErrorMessageSHOWED)
        ConnectionErrorMessage.show();
      ConnectionErrorMessageSHOWED = true;
    });
  }
  console.log("Checking Config")
  Settings.option({'ip': '192.168.2.150', 'port':'6680'}) // TODO REMEMBER TO DELETE!!!!!!!!!!!!!!!!!!!!!
  var MopidyIP = Settings.option('ip');
  var MopidyPort = Settings.option('port');
  var myServer = "ws://"+MopidyIP+":"+MopidyPort+"/mopidy/ws/";

  if(MopidyIP === undefined || MopidyPort === undefined){
    if(!ErrorMessageSHOWED)
      NoConfigMessage.show();
    NoConfigMessageSHOWED = true;
  } else {
    makeConnection(myServer);
  }
}

function MainMenuFunction(){
  var mainMenu = new UI.Menu({
    highlightBackgroundColor: '#bf00ff',
    sections: [{
      items: [{
        icon: 'images/menu_music.png',
        title: 'Now Playing'
      }, {
        icon: 'images/menu_queue.png',
        title: 'Queue'
      }, {
        icon: 'images/menu_browse.png',
        title: 'Browse Folders'
      }]
    }]
  });
  if(!mainMenuSHOWED)
    mainMenu.show();

  mainMenu.on('select', function(e) {
    console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
    console.log('The item is titled "' + e.item.title + '"');
    if (e.item.title === 'Now Playing'){
      nowPlayingFunction();
    } else if (e.item.title === 'Queue'){
      libraryQueueFunction();
    } else if (e.item.title === 'Browse Folders'){
      libraryFilesFunction(null);
    }
  });
}

function nowPlayingFunction(){
  var updateScreenInfo = function() {
    mopidy.playback.getCurrentTlTrack().done(function(info){
      seekMax = msToTime(info.track.length)
    });
    mopidy.playback.getState().done(function(state){
      if(state === 'playing'){
        nowPlayingStatus.image("images/playing.png");
      } else if(state === "stopped") {
        nowPlayingStatus.image("images/stopped.png");
      } else if(state === "paused") {
        nowPlayingStatus.image("images/paused.png");
      }
    });
    mopidy.playback.getTimePosition().done(function(position){
      console.log(position);
      seekPosition = msToTime(position);
      if(position != 0){
        mopidy.playback.getCurrentTrack()
          .done(function(track) {
            console.log(JSON.stringify(track));
            nowPlayingSongTitle.text(track.name);
            nowPlayingSongArtist.text(track.artists[0].name);
            if(track.hasOwnProperty("album"))
              nowPlayingSongAlbum.text(track.album.name);
            nowPlayingPosition.text(seekPosition+'/'+seekMax);
          });
      } else {
        nowPlayingSongTitle.text('No Music');
        nowPlayingSongArtist.text('');
        nowPlayingSongAlbum.text('');
        nowPlayingPosition.text('');
      }
    });
  };

  // ----==== Pebble Window ====----
  var nowPlaying = new UI.Window({
    fullscreen: true,
    action: {
      up: 'images/previous.png',
      down: 'images/next.png',
      select: 'images/play_pause.png'
    }
  });
  var nowPlayingSongTitle = new UI.Text({
    position: new Vector2(0, 0),
    size: new Vector2(115, 55),
    font: 'gothic-24-bold',
    textOverflow: 'fill',
    borderColor: 'clear',
    textAlign: 'left',
    color: 'green',
    text: ''
  });
  var nowPlayingSongArtist = new UI.Text({
    position: new Vector2(0, 55),
    size: new Vector2(115, 25),
    font: 'gothic-18',
    textOverflow: 'fill',
    borderColor: 'clear',
    textAlign: 'left',
    color: 'green',
    text: ''
  });
  var nowPlayingSongAlbum = new UI.Text({
    position: new Vector2(0, 80),
    size: new Vector2(115, 25),
    font: 'gothic-18',
    textOverflow: 'fill',
    borderColor: 'clear',
    textAlign: 'left',
    color: 'green',
    text: ''
  });
  var nowPlayingVolume = new UI.Text({
    position: new Vector2(0, 120),
    size: new Vector2(40, 20),
    font: 'mono-font-14',
    borderColor: 'clear',
    textAlign: 'left',
    color: 'yellow',
    text: ''
  });
  var nowPlayingPosition = new UI.Text({
    position: new Vector2(0, 140),
    size: new Vector2(100, 27),
    font: 'gothic-24',
    borderColor: 'clear',
    textAlign: 'left',
    color: '#ff00ff',
    text: ''
  });
  var nowPlayingStatus = new UI.Image({
    position: new Vector2(85, 110),
    size: new Vector2(24, 32),
    borderColor: 'clear',
    image: ''
  });
  nowPlaying.add(nowPlayingSongTitle);
  nowPlaying.add(nowPlayingSongArtist);
  nowPlaying.add(nowPlayingSongAlbum);
  nowPlaying.add(nowPlayingVolume);
  nowPlaying.add(nowPlayingPosition);
  nowPlaying.add(nowPlayingStatus);
  nowPlaying.show();
  if(Pebble.getActiveWatchInfo) {
    var watch = Pebble.getActiveWatchInfo();
    if(watch.platform === 'chalk'){
      nowPlayingSongTitle.position(new Vector2(5, 60));
      nowPlayingSongTitle.size(new Vector2(135, 55));
      nowPlayingSongTitle.textAlign('center');
      nowPlayingSongArtist.position(new Vector2(30, 20));
      nowPlayingSongArtist.textAlign('center');
      nowPlayingSongAlbum.position(new Vector2(30, 40));
      nowPlayingSongAlbum.textAlign('center');
      nowPlayingVolume.position(new Vector2(40, 150));
      nowPlayingPosition.position(new Vector2(35, 120));
      nowPlayingStatus.position(new Vector2(90, 145));
    }
  }


  // ----==== Variables ====----
  var musicInterval;
  var seekMax = 0;
  var seekPosition = 0;
  var musicVolume;

  // ----==== Init ====----
  mopidy.mixer.getVolume().done(function(volume){
    musicVolume = volume;
    nowPlayingVolume.text(musicVolume+'%');
  });

  updateScreenInfo();
  musicInterval = setInterval(function() {
    updateScreenInfo();
  }, 1000);

  // ----==== Pebble Buttons Actions ====----
  nowPlaying.on('click', 'up', function(e) {
    musicVolume = musicVolume + 10;
    if(musicVolume > 100){
      musicVolume = 100;
    }
    mopidy.mixer.setVolume(musicVolume).done(function(){
      nowPlayingVolume.text(musicVolume+'%');
    });
  });

  nowPlaying.on('click', 'down', function(e) {
    musicVolume = musicVolume - 10;
    if(musicVolume < 0){
      musicVolume = 0;
    }
    mopidy.mixer.setVolume(musicVolume).done(function(){
      nowPlayingVolume.text(musicVolume+'%');
    });
  });

  nowPlaying.on('click', 'select', function(e) {
    mopidy.playback.getState().done(function(state){
      if(state === 'playing'){
        mopidy.playback.pause();
      } else {
        mopidy.playback.play();
      }
    });
  });

  nowPlaying.on('longClick', 'up', function(e) {
    Vibe.vibrate('short');
    mopidy.playback.previous();
  });

  nowPlaying.on('longClick', 'down', function(e) {
    Vibe.vibrate('short');
    mopidy.playback.next();
  });

  nowPlaying.on('longClick', 'select', function(e) {
    Vibe.vibrate('short');
    mopidy.playback.stop();
  });

  nowPlaying.on('click', 'back', function(e) {
    clearInterval(musicInterval);
    nowPlaying.hide();
  });
}

function libraryQueueFunction(){
  var getQueue = function(selectPlaying) {
    var nowPlayingURI;
    var nowPlayingIcon;
    mopidy.playback.getCurrentTlTrack().done(function(song){
      if(song !== null)
        nowPlayingURI = song.track.uri;
    });
    mopidy.playback.getState().done(function(state){
      if(state === 'playing'){
        nowPlayingIcon = "images/playing.png";
      } else if(state === "stopped") {
        nowPlayingIcon = "images/stopped.png";
      } else if(state === "paused") {
        nowPlayingIcon = "images/paused.png";
      }
    });
    mopidy.tracklist.getTlTracks().done(function(tracks){
      var items = [];
      for(i in tracks){
        var subtitle = "";
        var icon = "";
        if(tracks[i].track.hasOwnProperty("artists"))
          subtitle = tracks[i].track.artists[0].name;
        if(tracks[i].track.uri === nowPlayingURI){
          icon = nowPlayingIcon;
          nowPlayingIndex = i;
        }
        items.push({
          title: tracks[i].track.name,
          subtitle: subtitle,
          icon: icon,
          name: tracks[i].track.name,
          tlid: tracks[i].tlid,
          tl_track: tracks[i]
        });
      }
      libraryQueue.items(0, items);
      if(selectPlaying)
        libraryQueue.selection(0, nowPlayingIndex);
    });
  };

  // ----==== Pebble Menu ====----
  var libraryQueue = new UI.Menu({
    highlightBackgroundColor: '#bf00ff',
    sections: [{
      title: 'Queue',
      items: []
    }]
  });
  libraryQueue.show();


  // ----==== Init ====----
  getQueue(true);
  musicInterval = setInterval(function() {
    getQueue(false);
  }, 1000);

  // ----==== Buttons actions ====----
  libraryQueue.on('select', function(e) {
    mopidy.playback.play(tl_track=e.item.tl_track);
  });

  libraryQueue.on('longSelect', function(e) {
    console.log(e.item.name);
    console.log(e.item.title);
    mopidy.tracklist.remove(criteria={'name': [e.item.name]});
    getQueue(false);
  });
}

function libraryFilesFunction(BrowseURI){
  var selectOption = function(filePath){
    // ----==== Pebble Menu ====----
    var selectOptionMenu = new UI.Menu({
      highlightBackgroundColor: '#bf00ff',
      sections: [{
        title: 'Select an Option',
        items: [{
          title: 'Add and replace Queue'
        }, {
          title: 'Add to Queue'
        }]
      }]
    });
    selectOptionMenu.show();

    // ----==== Buttons ====----
    selectOptionMenu.on('select', function(e) {
      if (e.item.title === 'Add and replace Queue'){
        mopidy.tracklist.clear()
        playFiles(filePath);
        selectOptionMenu.hide();
      } else if (e.item.title === 'Add to Queue'){
        playFiles(filePath);
        selectOptionMenu.hide();
      }
    });
  }

  var playFiles = function(filePath) {
    mopidy.library.browse(uri=filePath).done(function(files){
      for(i in files){
        if(files[i].type === 'directory'){
          playFiles(files[i].uri);
        } else if(files[i].type === 'track') {
          mopidy.tracklist.add(null, null, uri=files[i].uri, null)
        }
      }
    });
  };

  // ----==== Pebble Menu ====----
  var browseFiles = new UI.Menu({
    highlightBackgroundColor: '#bf00ff',
    sections: [{
      title: 'Browse Files',
      items: []
    }]
  });
  browseFiles.show();

  // ----==== Init ====----
  console.log(BrowseURI);
  mopidy.library.browse(uri=BrowseURI).done(function(files){
    var items = [];
    for(i in files){
      items.push({
        title: files[i].name,
        subtitle: files[i].type,
        uri: files[i].uri
      });
    }
    browseFiles.items(0, items);
    browseFiles.selection(0, 0);
  });

  // ----==== Buttons ====----
  browseFiles.on('longSelect', function(e) {
    selectOption(e.item.uri);
    Vibe.vibrate('short');
  });

  browseFiles.on('select', function(e) {
    type = e.item.subtitle;
    if(type === 'directory'){
      libraryFilesFunction(e.item.uri);
    } else if(files[i].type === 'track') {
      mopidy.tracklist.add(null, null, uri=e.item.uri, null)
    }
  });
}
