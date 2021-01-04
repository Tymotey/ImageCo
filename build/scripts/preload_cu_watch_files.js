/*jshint esversion: 6 */
//require('log-timestamp');
const fs = require('fs');
const chokidar = require('chokidar');
let foldersWatchers = [];
let foldersData = [{
  'id': btoa('D:\\_ImagesCo\\_to_convert'),
  'dirWatch': 'D:\\_ImagesCo\\_to_convert',
  'dirTo': 'D:\\_ImagesCo\\_converted',
  'processType': 'optimize',
  'watcherFiles': ''
}];

window.addEventListener('DOMContentLoaded', () => {
  if (foldersData.length) {
    let i = 0;
    foldersData.forEach(folder => {
      if (fs.existsSync(folder.dirWatch) && fs.existsSync(folder.dirTo)) {
        let element_folder = document.getElementById('folder_watch').getElementsByClassName('value')[0];
        element_folder.innerText = safePath(folder.dirWatch);

        element_folder = document.getElementById('folder_to').getElementsByClassName('value')[0];
        element_folder.innerText = safePath(folder.dirTo);

        element_folder = document.getElementById('folder_operation').getElementsByClassName('value')[0];
        element_folder.innerText = folder.processType;

        foldersWatchers.push(startWatcher(folder.dirWatch));
        i++;
      } else {
        console.log('Dir: ' + folder.dirWatch + ' OR ' + folder.dirTo + ' do not exists.');
      }
    });
  }
});

// BETTER: https://bezkoder.com/node-js-watch-folder-changes/
function startWatcher(watchDir) {
  foldersWatchers = [];
  let idFolder = btoa(watchDir);
  let watcher = chokidar.watch(watchDir, {
    ignored: /[\/\\]\./,
    persistent: true
  });

  function onWatcherReady() {
    console.log('Watcher for dir ' + watchDir + '(ID: ' + idFolder + ') ready!');
    folderChanged(watchDir);
  }

  // Start Watcher for folder.
  watcher
    .on('error', function (error) {
      console.log('Error happened' + watchDir + '(ID: ' + idFolder + '): ', error);
    })
    .on('ready', onWatcherReady)
    .on('raw', function (event, path, details) {
      folderChanged(watchDir);
    });

  return {
    'folder': idFolder,
    'watcher': watcher,
  };
}

function folderChanged(watchDir) {
  const idFolder = btoa(watchDir);

  if (fs.existsSync(watchDir)) {
    fs.readdir(safePath(watchDir), (err, files) => {
      // Make Files array from folder.
      let tmpFiles = [];
      if (undefined !== files) {
        files.forEach(file => {
          tmpFiles.push(watchDir + '\\' + file);
        });

        // Files Watcher for folder.
        let tmp = chokidar.watch(tmpFiles, {
          ignored: /(^|[\/\\])\../, // ignore dotfiles
          persistent: true
        });

        function onWatcherReady() {
          console.log('Files Watcher for dir ' + watchDir + '(ID: ' + idFolder + ') ready!');
          fileChanged(watchDir, true);
        }

        tmp
          .on('error', function (error) {
            console.log('Error happened on Files Watch for ' + watchDir + '(ID: ' + idFolder + '): ', error);
          })
          .on('ready', onWatcherReady)
          .on('raw', function (event, path, details) {
            fileChanged(path, false);
            console.log('Raw event info:', event, path, details);
          });

        for (let i = 0; i < foldersData.length; i++) {
          if (foldersData[i].id === idFolder) {
            foldersData[i].watcherFiles = tmp;
          }
        }
      }
    });
  }
}


  // if (true === needMove) {
  //   fs.rename(folderData.dirWatch + folderDelim + file, folderData.dirTo + folderDelim + file, function (err) {
  //     if (err) throw err;
  //     console.log('Successfully moved file: ' + file);
  //   });
  // }

function fileChanged(watchDir, watcherInit) {
  console.log(watchDir);
  if (fs.existsSync(watchDir)) {
    fs.readdir(safePath(watchDir), (err, files) => {

    }
  }
}

function safePath(path) {
  return path;
}