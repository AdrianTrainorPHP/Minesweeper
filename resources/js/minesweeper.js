const Minesweeper = function () {
  let
    self = this,
    elements = {
      body: $('body'),
      game: $('#game'),
      header: $('#header'),
      headerInfo: $('#header-info'),
      images: $('#unmarked-mines img'),
      minefield: $('#minefield'),
      optionsDropdown: $('#options-drop-down'),
      tiles: $('.tile'),
      veil: $('#veil'),
      veilText: $('#veil-text'),
    },
    countAcross,
    countDown,
    countNoOfMines,
    gameType,
    leftClickTimeStamp,
    minesLeft,
    noOfTiles,
    noOfMines,
    releasedTiles,
    releasedTilesCount,
    rightClickTimeStamp,
    setMines = [],
    timerStarted,
    timerId,
    timer;

  function positionGame() {
    elements.game.css('left', (($(window).width() / 2) - (elements.game.width() / 2)) + 'px');
  }

  function positionVeil() {
    if (elements.veil.length > 0) {
      const minefieldOffset = elements.minefield.offset();
      elements.veil.css('top', minefieldOffset.top + 'px').css('left', minefieldOffset.left + 'px');
      const veilTextTop = minefieldOffset.top + (elements.minefield.height() / 2) - 40;
      const veilTextLeft = minefieldOffset.left + (elements.minefield.width() / 2) - (elements.veilText.width() / 2);
      elements.veilText.css('top', veilTextTop + 'px').css('left', veilTextLeft + 'px');
    }
  }

  function updateMinesLeft() {
    let
      mineCounter = 0,
      digitsMinesLeft = '';
    switch (minesLeft.toString().length) {
      case 1:
        mineCounter = 0;
        elements.images.each(function () {
          mineCounter++;
          if (mineCounter < 3) {
            $(this).attr('src', 'dist/img/0.png');
            return;
          }
          $(this).attr('src', 'dist/img/' + minesLeft + '.png');
        });
        break;
      case 2:
        digitsMinesLeft = minesLeft.toString().split('');
        mineCounter = 0;
        elements.images.each(function () {
          mineCounter++;
          if (mineCounter < 2) {
            $(this).attr('src', 'dist/img/0.png');
            return;
          }
          $(this).attr('src', 'dist/img/' + digitsMinesLeft[mineCounter - 2] + '.png');
        });
        break;
      default:
        digitsMinesLeft = minesLeft.toString().split('');
        mineCounter = 0;
        elements.images.each(function () {
          $(this).attr('src', 'dist/img/' + digitsMinesLeft[mineCounter] + '.png');
          mineCounter++;
        });
    }
  }

  function newGameImageChange(face) {
    $('#new-game-icon img').attr('src', 'dist/img/new-game-' + face + '.png');
    if (face === 'uh-oh') {
      setTimeout(function () {
        $('#new-game-icon img').attr('src', 'dist/img/new-game-happy.png');
      }, 100);
    }
  }

  function startGame() {
    timerStarted = true;
    timerId = setInterval(function () {
      timer++;
      let
        digits,
        first = $('#timer img:nth-child(1)'),
        second = $('#timer img:nth-child(2)'),
        third = $('#timer img:nth-child(3)');
      switch (timer.toString().length) {
        case 1:
          first.attr('src', 'dist/img/0.png');
          second.attr('src', 'dist/img/0.png');
          third.attr('src', 'dist/img/' + timer + '.png');
          break;
        case 2:
          digits = timer.toString().split('');
          first.attr('src', 'dist/img/0.png');
          second.attr('src', 'dist/img/' + digits[0] + '.png');
          third.attr('src', 'dist/img/' + digits[1] + '.png');
          break;
        case 3:
          digits = timer.toString().split('');
          first.attr('src', 'dist/img/' + digits[0] + '.png');
          second.attr('src', 'dist/img/' + digits[1] + '.png');
          third.attr('src', 'dist/img/' + digits[2] + '.png');
          break;
        default:
          stopTimer();
          $('#timer img').each(function () {
            $(this).attr('src', 'dist/img/9.png');
          });
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerId);
  }

  function addVeil(winLose) {
    let minefieldClass = 'advanced';
    switch (gameType) {
      case 1:
        minefieldClass = 'beginner';
        break;
      case 2:
        minefieldClass = 'intermediate';
        break;
    }

    elements.body.prepend('<div id="veil" class="hidden ' + minefieldClass + '"></div><div id="veil-text" class="hidden"><span></span></div>');
    elements.veil = $('#veil');
    elements.veilText = $('#veil-text');

    if (winLose === 'win') {
      elements.veilText.find('span').append('You Won!');
    } else {
      elements.veilText.find('span').append('You Hit A Mine!');
    }
    positionVeil();
    elements.veil.fadeIn('fast');
    elements.veilText.fadeIn('fast');
  }

  function stopGame(winLose) {
    stopTimer();
    if (winLose === 'lose') {
      setTimeout(function () {
        newGameImageChange('sad');
      }, 100);
      addVeil('lose');
    } else {
      addVeil('win');
    }
  }

  function isGameOverYet() {
    if ($('.tile-released').length === (noOfTiles - noOfMines)) {
      stopGame('win');
    }
  }

  function getNeighbourIds(tileId) {
    let
      neighbourIds = [],
      countNs = 0,
      above = false,
      below = false,
      left = false,
      right = false;

    if ((tileId - 1) > 0 && (tileId % countAcross) !== 1) {
      left = true;
      if ($.inArray((tileId - 1), releasedTiles) === -1) {
        neighbourIds[countNs] = (tileId - 1);
        countNs++;
      }
    }

    if ((tileId + 1) <= noOfTiles && (tileId % countAcross) !== 0) {
      right = true;
      if ($.inArray((tileId + 1), releasedTiles) === -1) {
        neighbourIds[countNs] = (tileId + 1);
        countNs++;
      }
    }

    if ((tileId - countAcross) > 0) {
      above = true;
      if ($.inArray((tileId - countAcross), releasedTiles) === -1) {
        neighbourIds[countNs] = (tileId - countAcross);
        countNs++;
      }
    }

    if ((tileId + countAcross) <= noOfTiles) {
      below = true;
      if ($.inArray((tileId + countAcross), releasedTiles) === -1) {
        neighbourIds[countNs] = (tileId + countAcross);
        countNs++;
      }
    }

    if (left && above && $.inArray((tileId - countAcross - 1), releasedTiles) === -1) {
      neighbourIds[countNs] = (tileId - countAcross - 1);
      countNs++;
    }

    if (right && above && $.inArray((tileId - countAcross + 1), releasedTiles) === -1) {
      neighbourIds[countNs] = (tileId - countAcross + 1);
      countNs++;
    }

    if (left && below && $.inArray((tileId + countAcross - 1), releasedTiles) === -1) {
      neighbourIds[countNs] = (tileId + countAcross - 1);
      countNs++;
    }

    if (right && below && $.inArray((tileId + countAcross + 1), releasedTiles) === -1) {
      neighbourIds[countNs] = (tileId + countAcross + 1);
      countNs++;
    }

    return neighbourIds;
  }

  function releaseNeighbours(tileId) {
    let tileNeighbours = getNeighbourIds(tileId);
    $.each(tileNeighbours, function (index, tn) {
      if ($.inArray(tn, releasedTiles) === -1) {
        let target = $('#' + tn);
        if (!target.hasClass('marked-mine') && !target.hasClass('tile-released')) {
          target
            .removeClass('maybe-mine')
            .removeClass('tile-initialised')
            .addClass('tile-released');
          isGameOverYet();
          releasedTiles[releasedTilesCount] = tn;
          releasedTilesCount++;
          const countCloseMines = countNeighbourMines(tn);
          if (countCloseMines > 0 && countCloseMines < 9) {
            target
              .addClass('touching-mines')
              .addClass('nmc-' + countCloseMines)
              .append(countCloseMines);
            return;
          }
          if (countCloseMines === 0) {
            target.off('mouseup');
            releaseNeighbours(tn);
          }
        }
      }
    });

    $.each(tileNeighbours, function (index, tn) {
      if ($.inArray(tn, releasedTiles) === -1) {
        let target = $('#' + tn);
        if (!target.hasClass('marked-mine') && !target.hasClass('tile-released')) {
          target
            .removeClass('maybe-mine')
            .removeClass('tile-initialised')
            .addClass('tile-released');
          isGameOverYet();
          releasedTiles[releasedTilesCount] = tn;
          releasedTilesCount++;
          const countCloseMines = countNeighbourMines(tn);
          if (countCloseMines > 0 && countCloseMines < 9) {
            target
              .addClass('touching-mines')
              .addClass('nmc-' + countCloseMines)
              .append(countCloseMines);
          } else if (countCloseMines === 0) {
            target.off('mouseup');
            releaseNeighbours(tn);
          }
        }
      }
    });
  }

  function countNeighbourMines(tileId) {

    let
      countNMs = 0,
      above = false,
      below = false,
      left = false,
      right = false;

    if ((tileId - 1) > 0 && (tileId % countAcross) !== 1) {
      left = true;
      if ($.inArray((tileId - 1), setMines) !== -1) {
        countNMs++;
      }
    }

    if ((tileId + 1) <= noOfTiles && (tileId % countAcross) !== 0) {
      right = true;
      if ($.inArray((tileId + 1), setMines) !== -1) {
        countNMs++;
      }
    }

    if ((tileId - countAcross) > 0) {
      above = true;
      if ($.inArray((tileId - countAcross), setMines) !== -1) {
        countNMs++;
      }
    }

    if ((tileId + countAcross) <= noOfTiles) {
      below = true;
      if ($.inArray((tileId + countAcross), setMines) !== -1) {
        countNMs++;
      }
    }

    if (left && above) {
      if ($.inArray((tileId - countAcross - 1), setMines) !== -1) {
        countNMs++;
      }
    }

    if (right && above) {
      if ($.inArray((tileId - countAcross + 1), setMines) !== -1) {
        countNMs++;
      }
    }

    if (left && below) {
      if ($.inArray((tileId + countAcross - 1), setMines) !== -1) {
        countNMs++;
      }
    }

    if (right && below) {
      if ($.inArray((tileId + countAcross + 1), setMines) !== -1) {
        countNMs++;
      }
    }

    return countNMs;
  }

  function countMarkedNeighbourMines(tileId) {
    let
      countMNMs = 0,
      above = false,
      below = false,
      left = false,
      right = false;

    if ((tileId - 1) > 0 && (tileId % countAcross) !== 1) {
      left = true;
      if ($('#' + (tileId - 1)).hasClass('marked-mine')) {
        countMNMs++;
      }
    }

    if ((tileId + 1) <= noOfTiles && (tileId % countAcross) !== 0) {
      right = true;
      if ($('#' + (tileId + 1)).hasClass('marked-mine')) {
        countMNMs++;
      }
    }

    if ((tileId - countAcross) > 0) {
      above = true;
      if ($('#' + (tileId - countAcross)).hasClass('marked-mine')) {
        countMNMs++;
      }
    }

    if ((tileId + countAcross) <= noOfTiles) {
      below = true;
      if ($('#' + (tileId + countAcross)).hasClass('marked-mine')) {
        countMNMs++;
      }
    }

    if (left && above) {
      if ($('#' + (tileId - countAcross - 1)).hasClass('marked-mine')) {
        countMNMs++;
      }
    }

    if (right && above) {
      if ($('#' + (tileId - countAcross + 1)).hasClass('marked-mine')) {
        countMNMs++;
      }
    }

    if (left && below) {
      if ($('#' + (tileId + countAcross - 1)).hasClass('marked-mine')) {
        countMNMs++;
      }
    }

    if (right && below) {
      if ($('#' + (tileId + countAcross + 1)).hasClass('marked-mine')) {
        countMNMs++;
      }
    }

    return countMNMs;
  }

  function releaseTilesNotMarked(tileId) {
    let
      neighbourTiles = getNeighbourIds(tileId),
      noMineTouching = [],
      noMineTouchingCount = 0;
    $.each(neighbourTiles, function (index, value) {
      let target = $('#' + value);
      if (target.hasClass('maybe-mine')) {
        target.removeClass('maybe-mine');
      }

      if (target.hasClass('marked-mine') && $.inArray(value, setMines) !== -1) {
        return;
      }
      if (target.hasClass('marked-mine') && $.inArray(value, setMines) === -1) {
        target.addClass('mine-wrong');
        return;
      }

      if (!target.hasClass('marked-mine') && $.inArray(value, setMines) !== -1) {
        target.removeClass('tile-initialised').addClass('mine-found');
        $('.tile').off('mouseup');
        stopGame('lose');
        return;
      }

      target.removeClass('tile-initialised').addClass('tile-released');
      isGameOverYet();
      releasedTiles[releasedTilesCount] = value;
      releasedTilesCount++;

      let countCloseMines = countNeighbourMines(value);

      if (countCloseMines > 0 && countCloseMines < 9) {
        target.addClass('touching-mines').addClass('nmc-' + countCloseMines).append(countCloseMines);
        return;
      }

      if (countCloseMines === 0) {
        target.off('mouseup');
        noMineTouching[noMineTouchingCount] = value;
        noMineTouchingCount++;
      }
    });

    if (noMineTouchingCount > 0) {
      $.each(noMineTouching, function (index, value) {
        releaseNeighbours(value);
      });
    }
  }

  function leftClick(tileId) {
    let target = $('#' + tileId);

    if (target.hasClass('marked-mine') || target.hasClass('tile-released')) {
      return;
    }

    if (target.hasClass('maybe-mine')) {
      target.removeClass('maybe-mine');
    }

    if ($.inArray(tileId, setMines) !== -1) {
      target.addClass('mine-found');
      $('.tile').off('mouseup');
      stopGame('lose');
      return;
    }

    newGameImageChange('uh-oh');
    target.addClass('tile-released');
    isGameOverYet();
    releasedTiles[releasedTilesCount] = tileId;
    releasedTilesCount++;

    if (!timerStarted) {
      startGame();
    }

    const countCloseMines = countNeighbourMines(tileId);

    if (countCloseMines > 0 && countCloseMines < 9) {
      target.addClass('touching-mines').addClass('nmc-' + countCloseMines).append(countCloseMines);
      return;
    }

    if (countCloseMines === 0) {
      target.off('mouseup');
      releaseNeighbours(tileId);
    }
  }

  function rightClick(tileId) {
    let target = $('#' + tileId);
    if (target.hasClass('tile-released')) {
      return;
    }
    if (target.hasClass('marked-mine')) {
      target.removeClass('marked-mine').addClass('maybe-mine');
      minesLeft++;
      updateMinesLeft();
      return;
    }
    if (target.hasClass('maybe-mine')) {
      target.removeClass('maybe-mine');
      updateMinesLeft();
      return;
    }

    target.addClass('marked-mine');
    minesLeft--;
    if (!timerStarted) {
      startGame();
    }
    updateMinesLeft();
  }

  function middleClick(tileId) {
    newGameImageChange('uh-oh');
    let target = $('#' + tileId);
    if (target.hasClass('tile-released') && (target.hasClass('nmc-1') || target.hasClass('nmc-2') || target.hasClass('nmc-3') || target.hasClass('nmc-4') || target.hasClass('nmc-5') || target.hasClass('nmc-6') || target.hasClass('nmc-7') || target.hasClass('nmc-8'))) {
      let noOfCloseMines = 0;
      const classList = target.attr('class').split(' ');
      $.each(classList, function (index, value) {
        if (value.indexOf('nmc-') !== -1) {
          noOfCloseMines = parseInt(value.replace('nmc-', ''));
        }
      });
      if (noOfCloseMines <= countMarkedNeighbourMines(tileId)) {
        releaseTilesNotMarked(tileId);
      }
    }
  }

  function mousedown(e) {
    if (e.which === 1) {
      if ($(this).hasClass('tile-initialised')) {
        $(this).removeClass('tile-initialised');
        const currentTileId = $(this).attr('id');
        $(this).mouseleave(function () {
          setTimeout(function () {
            let target = $('#' + currentTileId);
            if (!target.hasClass('tile-released')) {
              target.addClass('tile-initialised');
            }
          }, 15);
        });
      }
    }
  }

  function mouseup(e) {
    const tileId = parseInt($(this).attr('id'));
    let difference = 0,
      msDifference = 0;
    switch (parseInt(e.which)) {
      case 1:
        if ($(this).hasClass('tile-initialised')) {
          $(this).removeClass('tile-initialised');
        }
        leftClickTimeStamp = new Date().getTime();
        if (rightClickTimeStamp !== -1) {
          difference = leftClickTimeStamp - rightClickTimeStamp;
        }
        if (difference > 0 && difference < 21) {
          middleClick(tileId);
          break;
        }
        setTimeout(function () {
          if (rightClickTimeStamp !== -1) {
            msDifference = rightClickTimeStamp - leftClickTimeStamp;
          }
          if (msDifference > 0 && msDifference < 21) {
            middleClick(tileId);
            return;
          }
          leftClick(tileId);
        }, 20);
        break;
      case 3:
        rightClickTimeStamp = new Date().getTime();
        if (leftClickTimeStamp !== -1) {
          difference = rightClickTimeStamp - leftClickTimeStamp;
        }
        if (difference <= 0 || difference > 20) {
          setTimeout(function () {
            if (leftClickTimeStamp !== -1) {
              msDifference = leftClickTimeStamp - rightClickTimeStamp;
            }
            if (msDifference <= 0 || msDifference > 20) {
              rightClick(tileId);
            }
          }, 20);
        }
        break;
      default:
        middleClick(tileId);
    }
  }

  function setMineClickAction() {
    elements.tiles.on({
      mousedown: mousedown,
      mouseup: mouseup
    });
  }

  function setRandomMines() {
    setMines = [];
    while (countNoOfMines < noOfMines) {
      const randomTileId = Math.floor(Math.random() * noOfTiles) + 1;
      if (setMines.length > 0) {
        let alreadyExists = false;
        for (let mine of setMines) {
          if (mine === randomTileId) {
            alreadyExists = true;
            break;
          }
        }
        if (!alreadyExists) {
          setMines[countNoOfMines] = randomTileId;
          countNoOfMines++;
        }
        continue;
      }
      setMines[0] = randomTileId;
      countNoOfMines++;
    }
  }

  function changeMinefieldClass(nextGameType) {
    if (elements.minefield.attr('class') !== undefined) {
      elements.minefield.attr('class', '');
    }
    elements.minefield.addClass(nextGameType);
  }

  function changeHeaderClass(nextHeaderType) {
    if (elements.header.attr('class') !== undefined) {
      elements.header.attr('class', '');
    }
    elements.header.addClass(nextHeaderType);
  }

  function buildMineField() {
    elements.headerInfo.empty().append('<div id="unmarked-mines" class="digital-numbers"><img src="img/0.png" /><img src="img/0.png" /><img src="dist/img/0.png" /></div>' + '<div id="new-game-icon"><img src="dist/img/new-game-happy.png" /></div><div id="timer" class="digital-numbers"><img src="img/0.png" /><img src="img/0.png" /><img src="img/0.png" /></div>');
    elements.minefield.empty();
    switch (gameType) {
      case 2:
        changeMinefieldClass('intermediate');
        changeHeaderClass('header-beg-int');
        break;
      case 3:
        changeMinefieldClass('advanced');
        changeHeaderClass('header-advanced');
        break;
      default:
        changeMinefieldClass('beginner');
        changeHeaderClass('header-beg-int');
    }
    updateMinesLeft();
    for (var i = 1; i <= noOfTiles; i++) {
      elements.minefield.append('<div id="' + i + '" class="tile tile-initialised"></div>');
    }
    elements.tiles.addClass('tile-initialised');
    elements.tiles = $('.tile');
    setRandomMines();
    setMineClickAction();
    positionGame();
  }

  function initialiseGame(gameLevel) {
    if (elements.veil.length > 0) {
      $('#veil,#veil-text').remove();
      elements.veil = undefined;
      elements.veilText = undefined;
    }
    if (timerStarted) {
      stopTimer();
      timerId = null;
    }
    gameType = gameLevel;
    elements.optionsDropdown.find('.selected').removeClass('selected');
    switch (gameLevel) {
      case 2:
        countAcross = 16;
        countDown = 16;
        noOfMines = 40;
        elements.body.attr('class', 'body-min-height-int-adv');
        $('#intermediate').addClass('selected');
        break;
      case 3:
        countAcross = 30;
        countDown = 16;
        noOfMines = 99;
        elements.body.attr('class', 'body-min-height-int-adv');
        $('#advanced').addClass('selected');
        break;
      default:
        countAcross = 8;
        countDown = 8;
        noOfMines = 10;
        elements.body.attr('class', 'body-min-height-beginner');
        $('#beginner').addClass('selected');
    }
    noOfTiles = countAcross * countDown;
    minesLeft = noOfMines;
    countNoOfMines = 0;
    timerStarted = false;
    timer = 0;
    releasedTiles = [];
    releasedTilesCount = 0;
    leftClickTimeStamp = -1;
    rightClickTimeStamp = -1;
    buildMineField();
  }

  function preloadImage(src) {
    let img = $('<img src="" />');
    img.attr('src', src);
    img.attr('class', 'hidden');
    elements.body.append(img);
  }

  function preloadImages() {
    for (let i = 2; i < 10; i++) {
      preloadImage('dist/img/' + i + '.png');
    }
    preloadImage('dist/img/maybe-mine.png');
    preloadImage('dist/img/mine-found.png');
    preloadImage('dist/img/mine-wrong.png');
    preloadImage('dist/img/new-game-sad.png');
    preloadImage('dist/img/new-game-uh-oh.png');
  }

  function newGameAction() {
    elements.optionsDropdown.hide();
    initialiseGame(gameType);
  }

  function clickOptionAction(e) {
    e.stopPropagation();
    if (elements.optionsDropdown.is(':visible')) {
      elements.optionsDropdown.slideUp('fast');
      return;
    }
    elements.optionsDropdown.slideDown('fast');
  }

  function repositionGame() {
    positionGame();
    positionVeil();
  }

  function changeGameType(e) {
    e.stopPropagation();
    elements.optionsDropdown.hide();
    initialiseGame(parseInt($(this).attr('data-game-type')));
  }

  function hideOptions() {
    if (elements.optionsDropdown.is(':visible')) {
      elements.optionsDropdown.slideUp('fast');
    }
  }

  function setListeners() {
    $(document).on('click', '#new-game-icon', newGameAction);
    $(document).on('click', '#new-game', newGameAction);
    $(document).on('click', '[data-game-type]', changeGameType);
    $(document).on('click', '#options', clickOptionAction);
    $(document).on('click', hideOptions);
    $(window).resize(repositionGame);
    elements.body.bind('contextmenu', function () {
      return false;
    });
    elements.body.attr('unselectable', 'on').css('UserSelect', 'none').css('MozUserSelect', 'none').on('selectstart', false);
  }

  self.init = function () {
    preloadImages();
    initialiseGame(1);
    setListeners();
    return self;
  };

  return self;
};

$(document).ready(function () {
  (new Minesweeper()).init();
});