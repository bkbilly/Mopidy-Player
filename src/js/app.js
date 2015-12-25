/**
 * Welcome to MPD-Player!
 *
 * This is where you write your app.
 */
var UI = require('ui');
var Vector2 = require('vector2');
var Vibe = require('ui/vibe');
var myServer = "ws://192.168.2.150:6680/mopidy/ws/";


var main = new UI.Menu({
  sections: [{
    items: [{
      icon: 'images/menu_icon.png',
      title: 'Now Playing'
    }, {
      title: 'Queue'
    }, {
      title: 'Browse Folders'
    }]
  }]
});
main.show();


main.on('select', function(e) {
  console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
  console.log('The item is titled "' + e.item.title + '"');
  if (e.item.title === 'Now Playing'){
    nowPlayingFunction(myServer);
  } else if (e.item.title === 'Queue'){
    libraryQueueFunction(myServer);
  } else if (e.item.title === 'Browse Folders'){
    libraryFilesFunction(myServer);
  }
});


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

function nowPlayingFunction(myServer){
  var updateScreenInfo = function() {
    mopidy.playback.getCurrentTlTrack().done(function(info){
      seekMax = msToTime(info.track.length)
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
            nowPlayingSongAlbum.text(track.album.name);
            nowPlayingPosition.text(seekPosition+'/'+seekMax);
          });
      } else {
        nowPlayingSongTitle.text('No Music');
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
    size: new Vector2(114, 55),
    font: 'gothic-24-bold',
    textOverflow: 'fill',
    borderColor: 'clear',
    textAlign: 'left',
    color: 'green',
    text: ''
  });
  var nowPlayingSongArtist = new UI.Text({
    position: new Vector2(0, 55),
    size: new Vector2(114, 25),
    font: 'gothic-18',
    textOverflow: 'fill',
    borderColor: 'clear',
    textAlign: 'left',
    color: 'green',
    text: ''
  });
  var nowPlayingSongAlbum = new UI.Text({
    position: new Vector2(0, 80),
    size: new Vector2(114, 25),
    font: 'gothic-18',
    textOverflow: 'fill',
    borderColor: 'clear',
    textAlign: 'left',
    color: 'green',
    text: ''
  });
  var nowPlayingVolume = new UI.Text({
    position: new Vector2(0, 115),
    size: new Vector2(40, 30),
    font: 'mono-font-14',
    textAlign: 'left',
    color: 'red',
    text: ''
  });
  var nowPlayingPosition = new UI.Text({
    position: new Vector2(0, 130),
    size: new Vector2(114, 30),
    font: 'gothic-18',
    textAlign: 'left',
    color: 'red',
    text: ''
  });
  nowPlaying.add(nowPlayingSongTitle);
  nowPlaying.add(nowPlayingSongArtist);
  nowPlaying.add(nowPlayingSongAlbum);
  nowPlaying.add(nowPlayingVolume);
  nowPlaying.add(nowPlayingPosition);
  nowPlaying.show();

  // ----==== Variables ====----
  var musicInterval;
  var seekMax = 0;
  var seekPosition = 0;
  var Mopidy = require("mopidy");
  var mopidy = new Mopidy({
      webSocketUrl: myServer
  });
  mopidy.connect();
  var musicVolume;


  mopidy.on("state:online", function () {
    mopidy.mixer.getVolume().done(function(volume){
      musicVolume = volume;
      nowPlayingVolume.text(musicVolume+'%');
    });

    updateScreenInfo();
    musicInterval = setInterval(function() {
      updateScreenInfo();
    }, 1000);
  });
  mopidy.on("state:offline", function () {
    nowPlayingSongTitle.text("Offline...");
  });

  // ----==== Pebble Buttons Actions ====----
  nowPlaying.on('click', 'up', function(e) {
    musicVolume = musicVolume + 6;
    if(musicVolume > 100){
      musicVolume = 100;
    }
    mopidy.mixer.setVolume(musicVolume);
    nowPlayingVolume.text(musicVolume+'%');
  });

  nowPlaying.on('click', 'down', function(e) {
    musicVolume = musicVolume - 6;
    if(musicVolume < 0){
      musicVolume = 0;
    }
    mopidy.mixer.setVolume(musicVolume);
    nowPlayingVolume.text(musicVolume+'%');
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
    mopidy.history.getHistory().done(function(msg){
      console.log(JSON.stringify(msg));
    });
  });

  nowPlaying.on('click', 'back', function(e) {
    clearInterval(musicInterval);
    nowPlaying.hide();
  });
}

function libraryQueueFunction(myServer){
  var getQueue = function() {
    mopidy.tracklist.getTlTracks().done(function(tracks){
      items = [];
      for(i in tracks){
        subtitle = "";
        if(tracks[i].track.hasOwnProperty("artists"))
          subtitle = tracks[i].track.artists[0].name;
        items.push({
          title: tracks[i].track.name,
          subtitle: subtitle,
          name: tracks[i].track.name,
          tlid: tracks[i].tlid,
          tl_track: tracks[i]
        });
      }
      libraryQueue.items(0, items);
    });
  };

  var libraryQueue = new UI.Menu({
    sections: [{
      title: 'Queue',
      items: []
    }]
  });
  libraryQueue.show();

  var Mopidy = require("mopidy");
  var mopidy = new Mopidy({
      webSocketUrl: myServer
  });
  mopidy.connect();
  mopidy.on("state:online", function () {
    getQueue();
    musicInterval = setInterval(function() {
      getQueue();
    }, 1000);

  });

  libraryQueue.on('select', function(e) {
    mopidy.playback.play(tl_track=e.item.tl_track);
  });

  libraryQueue.on('longSelect', function(e) {
    console.log(e.item.name);
    console.log(e.item.title);
    mopidy.tracklist.remove(criteria={'name': [e.item.name]});
    getQueue();
  });
}

function libraryFilesFunction(myServer){
  var getFiles = function(filePath) {
    console.log(filePath);
    mopidy.library.browse(uri=filePath).done(function(files){
      items = [];
      for(i in files){
        items.push({
          title: files[i].name,
          subtitle: files[i].type,
          uri: files[i].uri
        });
      }
      browseFiles.items(0, items);
    });
  };

  var browseFiles = new UI.Menu({
    sections: [{
      title: 'Browse Files',
      items: []
    }]
  });
  browseFiles.show();

  var Mopidy = require("mopidy");
  var mopidy = new Mopidy({
      webSocketUrl: myServer
  });
  mopidy.connect();
  mopidy.on("state:online", function () {
    getFiles(null);
  });

  browseFiles.on('select', function(e) {
    type = e.item.subtitle;
    if(type === 'directory'){
      getFiles(e.item.uri);
    }
  });

}
