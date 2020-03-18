export default [
  "$rootScope",
  "$scope",
  "$location",
  "ConfigService",
  "lastPath",
  "$http",
  "Wait",
  "Uploader",
  (
    $rootScope,
    $scope,
    $location,
    ConfigService,
    lastPath,
    $http,
    Wait,
    Uploader
  ) => {
    $scope.fileText = "";
    $scope.lineNumbers = [];

    let handleFiles = file => {
      const reader = new FileReader();
      reader.onload = event => {
        const file = event.target.result;
        const allLines = file.split(/\r\n|\n/);
        allLines.forEach((line, index) => {
          $scope.fileText += `${line}\n`;
          $scope.lineNumbers.push(index + 1);
        });
        $scope.showPopup = true;
        let tArea = document.getElementById("listing");
        let numBlock = document.getElementById("nums");
        tArea.addEventListener("scroll", event => {
          numBlock.scrollTop = tArea.scrollTop;
        });
      };

      reader.onerror = event => {
        alert(event.target.error.name);
      };

      reader.readAsText(file);
    };

    $scope.setDomain = () => {
      console.log("fired", $scope.domain);
    };

    $scope.setConfig = files => {
      $scope.fileObj = files[0];
      handleFiles(files[0]);
    };

    $scope.uploadConfig = () => {
      Wait("start");
      let r = Uploader.upload("/deploy/uploads/", $scope.fileObj);
      r.then(
        function(r) {
          // success
          $scope.showPopup = false;
          Wait("stop");
        },
        function(r) {
          // failure
          Wait("stop");
          console.warn(r);
        }
      );
    };

    $scope.closePopup = () => {
      $scope.fileText = "";
      $scope.lineNumbers.length = 0;
      $scope.showPopup = false;
    };
  }
];
