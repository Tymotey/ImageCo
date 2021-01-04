/*jshint esversion: 8 */
//node('log-timestamp');
const imagemin = require('imagemin');
const imageminGifsicle = require('imagemin-gifsicle');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminOptipng = require('imagemin-optipng');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');

// Utils
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
let foldersWatchers = {};
let foldersData = [];
const settingsFile = 'imagesco-settings.json';
if (fs.existsSync('./' + settingsFile)) {
  let rawData = fs.readFileSync('./' + settingsFile);
  // TODO: create html from settings.
  foldersData = JSON.parse(rawData);
  foldersData = prepareJsonData(foldersData);


  window.addEventListener('DOMContentLoaded', () => {
    // TODO: HTML for tabs and list.
    if (foldersData.length) {
      foldersData.forEach(folder => {
        setFolderWatcher(folder.id, true);
      });
    }
  });
} else {
  alert('Setting file: "' + settingsFile + '" do not exists. Should be placed in app folder.');
}

function prepareJsonData(data) {
  let i = 0;
  data.forEach(folder => {
    // data[i]["id"] = btoa(data[i]["dirWatch"]);
    i++;
  });
  return data;
}

function setFolderWatcher(folder, forInit = false) {
  folder = getFolderData(folder);
  if (fs.existsSync(folder.dirWatch) && fs.existsSync(folder.dirTo)) {
    if (forInit) {
      addFolderInfoHtml(folder.id);
    } else {
      // setFolderInfoHtml(folder.id, 'watch', folder.dirWatch);
      // setFolderInfoHtml(folder.id, 'to', folder.dirTo);
      // setFolderInfoHtml(folder.id, 'type', getFolderOperationText(folder.processType));
      // setFolderInfoHtml(folder.id, 'mode', getFolderModeText(folder.processMode));
      // setFolderInfoHtml(folder.id, 'status', getFolderStatusText(folder.status));
    }

    let watcherTmp = startWatcher(folder.id, forInit);
    if (false !== watcherTmp) {
      foldersWatchers[folder.id] = watcherTmp;
    } else {
      console.log('Watcher: ' + folder.dirWatch + ' ID(' + folder.id + ') could not start.');
    }
  } else {
    console.log('Dir: ' + folder.dirWatch + ' OR ' + folder.dirTo + ' do not exists.');
  }
}

function setFolderInfo(idFolder, whatToChange, value) {
  let i = 0;
  foldersData.forEach(folder => {
    if (folder.id === idFolder) {
      let whatToChangeName = '';
      switch (whatToChange) {
        case 'watch':
          whatToChangeName = 'dirWatch';
          break;
        case 'to':
          whatToChangeName = 'dirTo';
          break;
        case 'type':
          whatToChangeName = 'processType';
          break;
        case 'mode':
          whatToChangeName = 'processMode';
          break;
        case 'status':
          whatToChangeName = 'processStatus';
          break;
      }
      foldersData[i][whatToChangeName] = value;
    }
    i++;
  });
}

function addFolderInfoHtml(idFolder) {
  let folderData = getFolderData(idFolder);
  if (false !== folderData) {
    let elementParent = document.getElementById('operations_details');
    let childHtml = '<div id="folder_'+folderData.id+'" class="folder_details"><div class="dirWatch"><span class="bold">Watching: </span><span class="value">'+folderData.dirWatch+'</span></div><div class="dirTo"><span class="bold">To: </span><span class="value">'+folderData.dirTo+'</span></div><div class="processStatus"><span class="bold">Status: </span><span class="value"></span></div></div>';
    elementParent.innerHTML += childHtml;
  }
}

function setFolderInfoHtml(idFolder, whatToChange, value = null) {
  if (null !== value) {
    let elementFolder = document.getElementById('folder_' + idFolder);
    let whatToChangeClass = '';
    switch (whatToChange) {
      case 'watch':
        whatToChangeClass = 'dirWatch';
        break;
      case 'to':
        whatToChangeClass = 'dirTo';
        break;
      case 'mode':
        whatToChangeClass = 'processMode';
        break;
      case 'type':
        whatToChangeClass = 'processType';
        break;
      case 'status':
        whatToChangeClass = 'processStatus';
        break;
    }

    elementFolder.getElementsByClassName(whatToChangeClass)[0].getElementsByClassName('value')[0].innerText = value;
  }
}

function setFolderStatus(idFolder, statusId) {
  setFolderInfo(idFolder, 'status', statusId);
  setFolderInfoHtml(idFolder, 'status', getFolderStatusText(statusId));
}

function getFolderModeText(mode) {
  let returnVal = 'Auto';
  if ('manual' === mode) {
    returnVal = 'Manual';
  }
  return returnVal;
}

function getFolderOperationText(operation) {
  let returnVal = 'Optimize';
  if ('convert' === operation) {
    returnVal = 'Convert';
  }
  return returnVal;
}

function getFolderStatusText(statusId) {
  let returnVal = 'Inactive';
  if (1 === statusId) {
    returnVal = 'Active';
  }
  return returnVal;
}

function startWatcher(idFolder, forInit = false) {
  foldersWatchers = {};
  let folderData = getFolderData(idFolder);
  if (false !== folderData) {
    let watcher = chokidar.watch(folderData.dirWatch, {
      ignored: /[\/\\]\./,
      persistent: true
    });

    function onWatcherReady() {
      console.log('Watcher for dir ' + folderData.dirWatch + '(ID: ' + idFolder + ') ready!');
      folderChanged(idFolder, forInit);
    }

    // Start Watcher for folder.
    watcher
      .on('error', function (error) {
        console.log('Error happened ' + folderData.dirWatch + '(ID: ' + idFolder + '): ', error);
      })
      .on('ready', onWatcherReady)
      .on('add', path => folderChanged(idFolder));

    return {
      'folder': idFolder,
      'watcher': watcher,
    };
  } else {
    return false;
  }
}

function folderChanged(idFolder, forInit = false) {
  setFolderStatus(idFolder, 1);
  try {
    let folderData = getFolderData(idFolder);
    if (false !== folderData) {
      if ('auto' === folderData.processMode) {
        if (fs.existsSync(folderData.dirWatch)) {
          fs.readdir(folderData.dirWatch, (err, files) => {
            if (undefined !== files) {
              files.forEach(file => {
                processFile(idFolder, file);
              });
            }
          });
        } else {
          console.log('Folder ' + folderData.dirWatch + '(ID: ' + idFolder + ') do not exist.');
          stopFolderWatch(idFolder);
        }
      }
    } else {
      console.error('Folder not found.', err);
    }
  } catch (err) {
    console.error('Folder changed error: ', err);
  }
  setFolderStatus(idFolder, 0);
}

async function processFile(idFolder, file) {
  let folderData = getFolderData(idFolder);
  fs.readFile(path.join(folderData.dirWatch, file), (err, buf) => {
    if (err) {
      console.log('Error reading file ' + file + ': ', err);
      return false;
    }

    imagemin([path.join(folderData.dirWatch, file)], {
      destination: folderData.dirTo,
      glob: false,
      plugins: [
        imageminGifsicle(),
        imageminJpegtran(),
        imageminOptipng(),
        imageminPngquant({
          quality: [0.5, 0.6]
        }),
        imageminSvgo({
          plugins: [{
            removeViewBox: false
          }]
        })
      ]
    }).then(fileTemp => {
      try {
        if (fs.existsSync(path.join(folderData.dirWatch, file))) {
          fs.unlinkSync(path.join(folderData.dirWatch, file));
        }
      } catch (err) {
        console.error('Error deleting file ' + file + ': ', err);
      }
    }).catch(error => {
      console.log('Error minifying file ' + file + ' ', error);
    });
  });
}

function getFolderData(idFolder) {
  let returnVal = false;
  for (let i = 0; i < foldersData.length; i++) {
    if (foldersData[i].id === idFolder) {
      return foldersData[i];
    }
  }
  return returnVal;
}

function stopFolderWatch(idFolder) {
  foldersWatchers.idFolder.close().then(() => console.log('Closed folder watcher id(' + idFolder + ')'));
}