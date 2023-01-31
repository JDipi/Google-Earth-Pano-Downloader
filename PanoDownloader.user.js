// ==UserScript==
// @name         Google Maps Pano Downloader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://*.google.com/local/imagery/report/*
// @require      https://code.jquery.com/jquery-3.6.3.min.js
// @require      https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.2.0/jszip.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.0/FileSaver.min.js
// @resource     PANOVIEW https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css
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

// TODO: make sure file extensions are correct for final image

/*
i < 16
j < 32
*/

(function () {
  function getStreetViewPano(key) {
    $(`<div id="images"></div>`).appendTo("body");
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

            // $(`<img id="panoTile" src="data:image/jpg;base64,${btoa(binary)}" x="${i}" y="${j}" style="grid-area: ${i + 1} / ${j + 1} / span 1 / span 1; width: 200px;" />`).appendTo("#images");
            // $(`<img id="panoTile" src="data:image/jpg;base64,${btoa(binary)}" x="${i}" y="${j}" style="grid-area: ${i + 1} / ${j + 1} / span 1 / span 1; width: 200px;" />`).appendTo("#image_div");
            let src = `data:image/jpg;base64,${btoa(binary)}`;
            images.push({ src, x: j, y: i });
          },
          error: function (xhr, textStatus, errorThrown) {
            console.log("whoops");
          },
        });
      }
    }
    return images;
  }

  const getPhotoSpherePano = (key) => {
    // CHECK IF THIS WIDTH IS UNIVERSAL, current max???
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

        $("#imgModal").show();
        fetch(`data:image/jpg;base64,${btoa(binary)}`)
          .then((res) => res.blob())
          .then((blob) => {
            pannellum.viewer("panorama", {
              type: "equirectangular",
              panorama: URL.createObjectURL(blob),
              autoRotateInactivityDelay: 3000,
              autoRotate: -5,
            });
          });
      },
      error: function (xhr, textStatus, errorThrown) {
        console.log(`error: ${errorThrown}`);
      },
    });
  };

  GM_addStyle(/*css*/ `
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


  `);

  $(`<button id="download">Download Pano</button>`).prependTo("c-wiz");

  $(/*html*/ `
    <div id="imgModal">
      <div id="image_div"></div>
      <div id="panorama"></div>
    </div>
  `).insertAfter(".O3cKLb");
  $("#imgModal").hide();

  GM_addStyle(GM_getResourceText("PANOVIEW"));

  function downloadImages(imgs) {
    let dirName = $(".R5MShd.Mqf7lf").text();
    var zip = new JSZip();
    imgs.forEach((el) => {
      // GM_download({
      //   url: el.src,
      //   name: `${dirName}/${el.x}-${el.y}.jpg`,
      //   onload: () => {
      //     console.log(`finished: ${dirName}/${el.j}-${el.i}.jpg`);
      //   },
      // });
      zip.file(`${el.x}-${el.y}.jpg`, el.src.split(",")[1], {base64: true});
    });
    zip.generateAsync({ type: "blob" }).then(content => saveAs(content, `${dirName}.zip`));
  }

  $("#download").on("click", () => {
    let key = window.location.href.match(/%212s(.*)/)[1];
    if ($("#streetview-preview").length) {
      let images = getStreetViewPano(key);
      let w = 0
      let h = 0
      images.forEach(el => {
        if (el.x+1 > w) w = el.x+1
        if (el.y+1 > h) h = el.y+1
        $(`<img id="panoTile" src="${el.src}" x="${el.x}" y="${el.y}" style="grid-area: ${el.y + 1} / ${el.x + 1} / span 1 / span 1; width: 100%; object-fit: cover;"/>`).appendTo("#image_div");
      })
      $("#image_div").css({"grid-template-rows": `repeat(${h}, 27px)`, "grid-template-columns": `repeat(${w}, 27px)`})
      $("#imgModal").show();
      // downloadImages(images);
    } else {
      getPhotoSpherePano(key);
    }
    console.log(key);
  });
})();
