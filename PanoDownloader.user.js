// ==UserScript==
// @name         Google Maps Pano Downloader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Downloads Google Earth Streetview panoramas
// @author       You
// @match        https://*.google.com/local/imagery/report/*
// @require      https://code.jquery.com/jquery-3.6.3.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.2.0/jszip.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.0/FileSaver.min.js
// @require      https://unpkg.com/merge-images@2.0.0/dist/index.umd.js
// @require      file:///C:/Users/turtl/OneDrive/Desktop/Google-Maps-Pano-Downloader/PanoDownloader.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=example.com
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_download
// ==/UserScript==

// https://creativecoding.soe.ucsc.edu/courses/cs526/papers/Cavallo_3DCityReconstruction2015.pdf
// https://earth.google.com/web/@33.66067346,-117.66092875,243.89608209a,0d,60y,183.31218558h,71.35119943t,0r/data=IhoKFlA4Z2pWb1liNHYxQk5sMjZ2dHBRakEQAg
// https://www.google.com/local/imagery/report/?cb_client=earth.iv&cbp=1,0,,0,0&gl=US&hl=en&image_key=%211e2%212s7q_90B0sQurvz9YWoQtClQ
// tiles: w7 h4 (x 0-6, y 0-3)

/*
i < 16
j < 32
*/

(function () {
  function getStreetViewPano(key) {
    let images = [];
    for (let i = 0; i < 16; i++) {
      for (let j = 0; j < 32; j++) {
        $.ajax({
          type: "GET",
          async: false,
          url: `https://streetviewpixels-pa.googleapis.com/v1/tile?panoid=${key}&x=${j}&y=${i}&zoom=5`,
          beforeSend: function (xhr) {
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
          },
          success: function (result, textStatus, jqXHR) {
            if (result.length < 1) {
              alert("The thumbnail doesn't exist");
              $("#thumbnail").attr("src", "data:image/png;base64,");
              return;
            }

            var binary = "";
            var responseText = jqXHR.responseText;
            var responseTextLen = responseText.length;

            for (let k = 0; k < responseTextLen; k++) {
              binary += String.fromCharCode(responseText.charCodeAt(k) & 255);
            }
            let src = `data:image/jpg;base64,${btoa(binary)}`;
            images.push({ src, x: j, y: i });
          },
          error: function (xhr, textStatus, errorThrown) {
            console.log("whoops");
          },
        });
        console.log(`Getting Tile: [${images.length}/512]`);
      }
    }
    return images;
  }

  const getPhotoSpherePano = (key) => {
    let url = $("#preview-image").attr("src").replace(/=w.*/gm, "=w16383");
    $.ajax({
      type: "GET",
      url,
      beforeSend: function (xhr) {
        xhr.overrideMimeType("text/plain; charset=x-user-defined");
      },
      success: function (result, textStatus, jqXHR) {
        if (result.length < 1) {
          alert("The thumbnail doesn't exist");
          $("#thumbnail").attr("src", "data:image/jpg;base64,");
          return;
        }

        var binary = "";
        var responseText = jqXHR.responseText;
        var responseTextLen = responseText.length;

        for (let k = 0; k < responseTextLen; k++) {
          binary += String.fromCharCode(responseText.charCodeAt(k) & 255);
        }

        fetch(`data:image/jpg;base64,${btoa(binary)}`)
          .then((res) => res.blob())
          .then((blob) => {
            saveAs(blob, `${$(".R5MShd.Mqf7lf").text()}.png`);
          });
      },
      error: function (xhr, textStatus, errorThrown) {
        console.log(`error: ${errorThrown}`);
      },
    });
  };

  GM_addStyle(/*css*/ `

    .outsideCLick {
      position: fixed;
      width: 100vw;
      height: 100vh;
      top: 0;
      left: 0;
      opacity: 50%;
      background-color: gray;
      z-index: -1;
    }

    #image_div {
      display: grid;
      position: relative;
      width: 100%;
      height: 50%;
      background: white;
      align-content: center;
      justify-content: center;
    }

    #image_div > img {
      position: absolute;
      height: 100%;
      transform: translate(-50%, 0px);
      left: 50%;
    }

    #download {
      padding: 5px;
      color: black;
      background-color: white;
      cursor: pointer;
    }

    #download:hover {
      background: gray;
    }

    #panorama {
      width: 100%;
      height: 50%;
    }

    #imgModal {
      position: fixed;
      display: flex;
      flex-direction: column;
      top: 50px;
      left: 40px;
      bottom: 50px;
      right: 40px;
      z-index: 1000002;
      background: gray;
      justify-content: center;
      align-items: center;
    }

    #canvas {
      width: 100%;
      height: 100%;
    }

    .test {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      overflow: scroll;
    }

  `);

  $(`<button id="download">Download Pano</button>`).prependTo("c-wiz");

  function downloadImages(imgs) {
    let dirName = $(".R5MShd.Mqf7lf").text();
    var zip = new JSZip();
    imgs.forEach((el) => {
      zip.file(`${el.x}-${el.y}.jpg`, el.src.split(",")[1], { base64: true });
    });
    zip.generateAsync({ type: "blob" }).then((content) => saveAs(content, `${dirName}.zip`));
  }

  $("#download").on("click", () => {
    let key = window.location.href.match(/%212s(.*)/)[1];
    if ($("#streetview-preview").length) {
      let images = getStreetViewPano(key);
      let spaced = [];
      images.forEach((el) => {
        spaced.push({ src: el.src, x: el.x * 512, y: el.y * 512 });
      });
      console.log("Stitching Tiles...");
      mergeImages(spaced, { width: 16384, height: 8192 }).then((b) => {
        fetch(b)
          .then((res) => res.blob())
          .then((blob) => {
            console.log("Downloading...");
            saveAs(blob, `${$(".R5MShd.Mqf7lf").text()}.png`);
          });
      });
      // downloadImages(images);
    } else {
      getPhotoSpherePano(key);
    }
  });
})();
