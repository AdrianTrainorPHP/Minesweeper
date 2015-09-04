(function ( $ ) {



  $.fn.minesweeper = function( options, debug )
  {
    if ( $.type( debug ) !== 'boolean' ) {
      debug = false;
    }

    var
      logger        = new ConsoleLogger( debug ),
      typeOfOptions = $.type( options );

    switch ( typeOfOptions ) {

      case 'object':
        break;

      case 'undefined':
        options = {};
        break;

      default:
        logger.log('Incorrect type passed for options - $.fn.minesweeper - var typeOfOptions = "' + typeOfOptions + '"');

    }

    var
      minefield = new Minefield( $(this), options, logger );
    minefield.init();

    return this;
  };



  var Minefield = function( minefieldContainer, options, loggerObj )
  {
    this.logger         = loggerObj;
    this.logger.typeCheck( minefieldContainer, 'undefined', true, 'Invalid slider container div has been passed to Minefield - $.type( sliderObj )');

    if (
      this.logger.typeCheck( options, 'undefined',  true,   'Options variable passed to Minefield is "undefined" - assigning empty object' ) ||
      this.logger.typeCheck( options, 'object',     false,  'Options variable passed to Minefield is invalid - assigning empty object' )
    ) {
      options = {};
    }

    this.options        = options;
    this.minefield      = minefieldContainer;
    this.defaultOptions = {
      gameLevel:                  1,
      gameType:                   1,
      beginnerMinefieldClass:     'beginner',
      intermediateMinefieldClass: 'intermediate',
      advancedMinefieldClass:     'advanced',
      begIntHeaderClass:          'header-beg-int',
      advancedHeaderClass:        'header-advanced',
      veilDivId:                  'veil',
      veilTextId:                 'veil-text',
      headerId:                   'header-info',
      digitalCounterClass:        'digital-numbers',
      unmarkedMineCounterId:      'unmarked-mines',
      digitalTimerDivId:          'timer',
      tileClass:                  'tile',
      tileStateClass: {
        initialised:                'tile-initialised',
        released:                   'tile-released',
        markedMine:                 'marked-mine',
        maybeMine:                  'maybe-mine',
        mineWrong:                  'mine-wrong',
        mineFound:                  'mine-found'
      },
      changeGameTypeIds: {
        beginner:     'beginner',
        intermediate: 'intermediate',
        advanced:     'advanced'
      },
      newGameIconDivId:           'new-game-icon',

      newGameUhOhIconImgSrc:      'img/new-game-uh-oh.png',
      newGameOkIconImgSrc:        'img/new-game-happy.png',
      newGameSadIconImgSrc:       'img/new-game-sad.png',
      maybeMineImgSrc:            'img/maybe-mine.png',
      mineFoundImgSrc:            'img/mine-found.png',
      mineWrongSrc:               'img/mine-wrong.png',
      digitalNumberImgSrc: [
        'img/0.png',
        'img/1.png',
        'img/2.png',
        'img/3.png',
        'img/4.png',
        'img/5.png',
        'img/6.png',
        'img/7.png',
        'img/8.png',
        'img/9.png'
      ],

      noOfNearMinesClass: {
        prepend:  'touching-mines ',
        1:        'nmc-1',
        2:        'nmc-2',
        3:        'nmc-3',
        4:        'nmc-4',
        5:        'nmc-5',
        6:        'nmc-6',
        7:        'nmc-7',
        8:        'nmc-8',
        9:        'nmc-9'
      }
    };

    this.settings   = {
      countAcross:          9,      // total tiles on the X axis - 9 = beginner, 16 = intermediate, 16 = expert
      countDown:            0,      // total tiles on the Y axis - 9 = beginner, 16 = intermediate, 30 = expert
      noOfTiles:            0,      // total tiles ( X * Y )
      noOfMines:            0,      // total mines on the minefield - 10 = beginner, 40 = intermediate, 99 = expert
      countNoOfMines:       0,      // no of mines still hidden - decrements on marking of mine
      setMines:             [],     // stores the locations of the mines
      timerStarted:         false,  // indicates when a game is in progress
      timerId:              null,   // stores the id of the interval which controls the time of the active game
      timer:                false,
      releasedTiles:        0,
      tileNeighbours:       [],
      releasedTilesCount:   0,
      tileNeighboursCount:  0,
      leftClickTimeStamp:   false,
      rightClickTimeStamp:  false
    };


    this.init = function ()
    {
      // overwrite any developer defined options over the default options and merge all into settings - the settings take priority
      this.settings = $.extend( this.defaultOptions, this.options, this.settings );

      var
        self            = this,
        s               = this.settings,
        body            = $('body'),
        optionsDropDown = $('#options-drop-down');

      // remove id and class selector identifiers from element id and class names
      this.removeIdAndClassMarkers( s.beginnerMinefieldClass );
      this.removeIdAndClassMarkers( s.intermediateMinefieldClass );
      this.removeIdAndClassMarkers( s.advancedMinefieldClass );
      this.removeIdAndClassMarkers( s.begIntHeaderClass );
      this.removeIdAndClassMarkers( s.advancedHeaderClass );
      this.removeIdAndClassMarkers( s.veilDivId );
      this.removeIdAndClassMarkers( s.veilTextId );
      this.removeIdAndClassMarkers( s.headerId );
      this.removeIdAndClassMarkers( s.digitalCounterClass );
      this.removeIdAndClassMarkers( s.unmarkedMineCounterId );
      this.removeIdAndClassMarkers( s.digitalTimerDivId );
      this.removeIdAndClassMarkers( s.tileClass );

      this.preloadImages();
      this.initialiseGame(1);


      body.bind('contextmenu', function(e)
      {
        return false;
      });
      $('#' + s.newGameIconDivId + ', #new-game').on('click', function()
      {
        optionsDropDown.hide();
        self.initialiseGame(s.gameType);
      });

      $(
        '#' + s.changeGameTypeIds.beginner +',' +
        '#' + s.changeGameTypeIds.intermediate + ',' +
        '#' + s.changeGameTypeIds.advanced
      ).click(function()
      {
        optionsDropDown.hide();
        switch ($(this).attr('id')) {

          case s.changeGameTypeIds.advanced:
            self.initialiseGame(3);
            break;

          case s.changeGameTypeIds.intermediate:
            self.initialiseGame(2);
            break;

          default:
            self.initialiseGame(1);
        }
      });

      body.attr('unselectable', 'on').css({'UserSelect': 'none', 'MozUserSelect': 'none'}).on('selectstart', false);
      $(window).resize(function()
      {
        self.positionGame();
        self.positionVeil();
      });
      $('#options').click(function(event)
      {
        if (optionsDropDown.is(':visible')) {
          optionsDropDown.slideUp('fast');
        } else {
          optionsDropDown.slideDown('fast');
        }
        event.stopPropagation();
      });
      $('.swp').click(function(e)
      {
        e.stopPropagation();
      });
      $(window).click(function()
      {
        if (optionsDropDown.is(':visible')) {
          optionsDropDown.slideUp('fast');
        }
      });
    };


    this.initialiseGame = function (gameType)
    {
      var
        s     = this.settings,
        body  = $('body');

      if ($('#' + s.veilDivId).length > 0) {
        $('#' + s.veilDivId + ',#' + s.veilTextId).remove();
      }

      if (s.timerStarted) {
        this.stopTimer();
        this.timerId = null;
      }

      switch (gameType) {
        case 'advanced':
          s.gameType = 3;
          break;
        case 'intermediate':
          s.gameType = 2;
          break;
        default:
          s.gameType = 1;
      }

      $('#options-drop-down .selected').removeClass('selected');

      switch (s.gameLevel) {

        case 2:
          s.countAcross = 16;
          s.countDown = 16;
          s.noOfMines = 40;
          body.attr('class', 'body-min-height-int-adv');
          $('#intermediate').addClass('selected');
          break;

        case 3:
          s.countAcross = 30;
          s.countDown = 16;
          s.noOfMines = 99;
          body.attr('class', 'body-min-height-int-adv');
          $('#advanced').addClass('selected');
          break;

        default:
          s.countAcross = 8;
          s.countDown = 8;
          s.noOfMines = 10;
          body.attr('class', 'body-min-height-beginner');
          $('#beginner').addClass('selected');
      }

      s.noOfTiles           = s.countAcross * s.countDown;
      s.minesLeft           = s.noOfMines;
      s.countNoOfMines      = 0;
      s.timerStarted        = false;
      s.timer               = 0;
      s.releasedTiles       = [];
      s.releasedTilesCount  = 0;
      s.leftClickTimeStamp  = null;
      s.rightClickTimeStamp = null;
      this.buildMineField();
    };

    this.preloadImages = function ()
    {

      var
        imgString   = '',
        s           = this.settings,
        hiddenStyle = ' style="display:none;" ';

      $.each (s.digitalNumberImgSrc, function( index, imgSrc )
      {
        imgString += '<img src="' + imgSrc + '"' + hiddenStyle + '/>';
      });

      imgString += '<img src="' + s.newGameUhOhIconImgSrc + '"' + hiddenStyle + '/>';
      imgString += '<img src="' + s.newGameOkIconImgSrc + '"' + hiddenStyle + '/>';
      imgString += '<img src="' + s.newGameSadIconImgSrc + '"' + hiddenStyle + '/>';
      imgString += '<img src="' + s.maybeMineImgSrc + '"' + hiddenStyle + '/>';
      imgString += '<img src="' + s.mineFoundImgSrc + '"' + hiddenStyle + '/>';
      imgString += '<img src="' + s.mineWrongSrc + '"' + hiddenStyle + '/>';

      $('body').append(imgString);
    };


    this.removeIdAndClassMarkers = function ( pointer )
    {
      pointer = pointer.replace( '#', '').replace( '.', '' );
    };

    this.buildMineField = function ()
    {
      var
        s                 = this.settings,
        headerHtml        = '',
        threeDigitalZeros = '';

      for (var zc = 0; zc < 4; zc++) {
        threeDigitalZeros += '<img src="' + s.digitalNumberImgSrc[0] + '" />';
      }

      headerHtml += '<div id="' + s.unmarkedMineCounterId + '" class="' + s.digitalCounterClass + '">';
      headerHtml += threeDigitalZeros + '</div>';
      headerHtml += '<div id="' + s.newGameIconDivId + '"><img src="' + s.newGameOkIconImgSrc + '" /></div>';
      headerHtml += '<div id="' + s.digitalTimerDivId + '" class="' + s.digitalCounterClass + '">';
      headerHtml += threeDigitalZeros + '</div>';

      $('#' + s.headerId ).empty().append( headerHtml );

      this.minefield.empty();

      switch (window.gameType) {

        case 2:
          this.changeMinefieldClass( s.intermediateMinefieldClass );
          this.changeHeaderClass( s.begIntHeaderClass );
          break;

        case 3:
          this.changeMinefieldClass( s.advancedMinefieldClass );
          this.changeHeaderClass( s.advancedHeaderClass );
          break;

        default:
          this.changeMinefieldClass( s.beginnerMinefieldClass );
          this.changeHeaderClass( s.begIntHeaderClass );

      }
      this.updateMinesLeft();

      for ( var i = 1; i <= s.noOfTiles; i++ ) {
        this.minefield.append( '<div id="' + i + '" class="' + s.tileClass + '"></div>' );
      }

      this.setRandomMines();
      $( '.' + s.tileClass ).addClass( s.tileStateClass.initialised );
      this.setMineClickAction();
      this.positionGame();
    };

    this.changeMinefieldClass = function ( nextGameType )
    {
      if ($.type( this.minefield.attr('class') ) !== 'undefined' ) {
        this.minefield.attr('class', '');
      }
      this.minefield.addClass( nextGameType );
    };

    this.changeHeaderClass = function ( nextHeaderType )
    {
      var
        header = $( '#' + this.settings.headerId );
      if ( $.type( header.attr('class') ) !== 'undefined' ) {
        header.attr('class','');
      }
      header.addClass( nextHeaderType );
    };

    this.positionGame = function()
    {
      this.minefield.css( 'left', ( ( $( window ).width() / 2 ) - ( this.minefield.width() / 2 ) ) );
    };

    this.positionVeil = function ()
    {
      var
        veilDiv   = $( '#' + this.settings.veilDivId),
        veilText  = $( '#' + this.settings.veilTextId );

      if ( veilDiv.length > 0 ) {

        var
          veilTextTopPosition, veilTextLeftPosition,
          minefieldOffset     = this.minefield.offset();

        veilDiv.css( 'top', minefieldOffset.top ).css( 'left', minefieldOffset.left );
        veilTextTopPosition   = minefieldOffset.top + ( this.minefield.height() / 2 ) - 40;
        veilTextLeftPosition  = minefieldOffset.left + ( this.minefield.width() / 2 ) - ( veilText.width() / 2 );
        veilText.css( 'top', veilTextTopPosition ).css('left', veilTextLeftPosition );

      }

    };

    this.updateMinesLeft = function ()
    {
      var
        digitsMinesLeft,
        s             = this.settings,
        mineCounter   = 0,
        unmarkedMines = $( '#' + s.unmarkedMineCounterId + ' img');

      switch ( s.minesLeft.toString().length ) {

        case 1:
          unmarkedMines.each(function()
          {
            mineCounter++;
            if ( mineCounter < 3 ) {
              $(this).attr( 'src', s.digitalNumberImgSrc[0] );
            } else {
              $(this).attr( 'src', s.digitalNumberImgSrc[s.minesLeft] );
            }
          });
          break;

        case 2:
          digitsMinesLeft = s.minesLeft.toString().split('');
          unmarkedMines.each( function()
          {
            mineCounter++;
            if (mineCounter < 2) {
              $(this).attr( 'src', s.digitalNumberImgSrc[0] );
            } else {
              $(this).attr( 'src', s.digitalNumberImgSrc[ digitsMinesLeft[ mineCounter - 2 ] ] );
            }
          });
          break;

        default:
          digitsMinesLeft = s.minesLeft.toString().split('');
          unmarkedMines.each(function()
          {
            $(this).attr( 'src', s.digitalNumberImgSrc[ digitsMinesLeft[ mineCounter ] ] );
            mineCounter++;
          });
      }
    };



    this.setRandomMines = function ()
    {
      var
        randomTileId, alreadyExists,
        s = this.settings;

      s.setMines = [];

      while ( s.countNoOfMines < s.noOfMines ) {

        randomTileId = Math.floor( Math.random() * s.noOfMines ) + 1;
        alreadyExists = false;

        if ( s.setMines.length === 0 || $.inArray( randomTileId, s.setMines ) === -1 ) {

          s.setMines.push( randomTileId );
          s.countNoOfMines++;

        }

      }

    };


    this.setMineClickAction = function ()
    {
      var
        self = this,
        s    = this.settings;

      $('.' + s.tileClass ).each( function ()
      {
        $(this).mousedown( function (event)
        {
          // if left mouse button pressed down
          if (event.which === 1) {

            if ($(this).hasClass( s.tileStateClass.initialised ) ) {

              $(this).removeClass( s.tileStateClass.initialised );

              // store a reference of the tile id for use in the timeout
              var
                currentTileId = $(this).attr('id');

              $(this).mouseleave( function ()
              {
                setTimeout( function ()
                {
                  var currentTile = $( '#' + currentTileId );

                  if ( !currentTile.hasClass( s.tileStateClass.released ) ) {
                    currentTile.addClass( s.tileStateClass.initialised );
                  }

                }, 15);
              });
            }
          }
        });

        $(this).mouseup(function(event)
        {
          var
            difference, msDifference,
            tileId = parseInt( $(this).attr( 'id' ) );

          switch (parseInt(event.which)) {

            case 1:

              $(this).removeClass( s.tileStateClass.initialised );
              s.leftClickTimeStamp  = new Date().getTime();
              difference            = 0;
              msDifference          = 0;

              if ( s.rightClickTimeStamp !== -1 ) {
                difference = s.leftClickTimeStamp - s.rightClickTimeStamp;
              }

              if ( difference > 0 && difference < 21 ) {

                self.middleClick( tileId );

              } else {

                setTimeout(function()
                {
                  if ( s.rightClickTimeStamp !== -1 ) {
                    msDifference = s.rightClickTimeStamp - s.leftClickTimeStamp;
                  }

                  if ( msDifference > 0 && msDifference < 21 ) {
                    self.middleClick( tileId );
                  } else {
                    self.leftClick( tileId );
                  }
                }, 20);
              }
              break;

            case 3:
              s.rightClickTimeStamp = new Date().getTime();
              difference            = 0;
              msDifference          = 0;

              if (window.leftClickTimeStamp !== -1) {
                difference = window.rightClickTimeStamp - window.leftClickTimeStamp;
              }

              if (difference <= 0 || difference > 20) {

                setTimeout(function()
                {
                  if (window.leftClickTimeStamp !== -1) {
                    msDifference = leftClickTimeStamp - rightClickTimeStamp;
                  }
                  if (msDifference <= 0 || msDifference > 20) {
                    self.rightClick(tileId);
                  }
                }, 20);
              }
              break;

            default:
              self.middleClick( tileId );
          }
        });
      });

    };


    this.middleClick = function ( tileId )
    {
      var
        s = this.settings,
        tile = $( '#' + tileId );

      this.newGameImageChange( s.newGameUhOhIconImgSrc );
      if (
        $.type( tile ) !== 'undefined'
        &&
        tile.hasClass( s.tileStateClass.released )
        &&
        (
        tile.hasClass(s.noOfNearMinesClass[1])
        ||
        tile.hasClass(s.noOfNearMinesClass[2])
        ||
        tile.hasClass(s.noOfNearMinesClass[3])
        ||
        tile.hasClass(s.noOfNearMinesClass[4])
        ||
        tile.hasClass(s.noOfNearMinesClass[5])
        ||
        tile.hasClass(s.noOfNearMinesClass[6])
        ||
        tile.hasClass(s.noOfNearMinesClass[7])
        ||
        tile.hasClass(s.noOfNearMinesClass[8])
        )
      ) {
        var
          noOfCloseMines  = 0,
          classList       = tile.attr( 'class' ).split(' ');

        $.each(classList, function( index, value )
        {
          if ( value.indexOf( 'nmc-' ) !== -1 ) {
            noOfCloseMines = parseInt( value.replace( 'nmc-', '' ) );
          }
        });

        if ( noOfCloseMines <= this.countNeighbourMines( tileId, true ) ) {
          this.releaseTilesNotMarked( tileId );
        }
      }
    };


    this.leftClick = function ( tileId )
    {
      var
        self  = this,
        s     = this.settings,
        tile  = $( '#' + tileId );

      if ($.type( tile ) !== 'undefined' ) {

        if ( !tile.hasClass(s.tileStateClass.markedMine) && !tile.hasClass(s.tileStateClass.released) ) {

          if ( $.inArray( tileId, s.setMines ) !== -1 ) {

            tile.addClass(s.tileStateClass.markedMine);
            $('.' + s.tileClass ).off('mouseup');
            this.stopGame('lose');

          } else {

            self.newGameImageChange(s.newGameUhOhIconImgSrc);
            tile.addClass(s.tileStateClass.released);
            self.isGameOverYet();
            s.releasedTiles[ s.releasedTilesCount ] = tileId;
            s.releasedTilesCount++;
            if ( !window.timerStarted ) {
              this.startGame();
            }

            var
              countCloseMines = self.countNeighbourMines(tileId, false);

            if (countCloseMines > 0 && countCloseMines < 9) {
              tile.addClass( s.noOfNearMinesClass.prepend + s.noOfNearMinesClass[countCloseMines] ).append( countCloseMines );
            } else if (countCloseMines === 0) {
              tile.off('mouseup');
              this.releaseNeighbours( tileId );
            }
          }
        }
      }
    };


    this.rightClick = function ( tileId )
    {
      var
        s     = this.settings,
        tile  = $( '#' + tileId );

      if ( !tile.hasClass(s.tileStateClass.released)) {

        if ( tile.hasClass(s.tileStateClass.markedMine)) {

          tile.removeClass(s.tileStateClass.markedMine);
          tile.addClass(s.tileStateClass.maybeMine);
          s.minesLeft++;

        } else if (s.hasClass(s.tileStateClass.maybeMine)) {

          tile.removeClass(s.tileStateClass.maybeMine);

        } else {

          tile.addClass(s.tileStateClass.markedMine);
          s.minesLeft--;
          if (!s.timerStarted) {
            this.startGame();
          }

        }

        this.updateMinesLeft();

      }
    };


    this.newGameImageChange = function ( face )
    {
      var
        s = this.settings,
        newGameIcon = $( '#' + s.newGameIconDivId + ' img');

      newGameIcon.attr('src', face);


      if (face === s.newGameUhOhIconImgSrc) {
        setTimeout(function()
        {
          newGameIcon.attr('src', s.newGameOkIconImgSrc);
        }, 100);
      }
    }


    this.releaseTilesNotMarked = function ( tileId )
    {
      var
        self                = this,
        s                   = this.settings,
        neighbourTiles      = this.getNeighbourIds(tileId),
        noMineTouching      = [],
        noMineTouchingCount = 0;

      $.each(neighbourTiles, function(index, value)
      {
        var
          neighbourTile = $('#' + value);

        neighbourTile.removeClass(s.tileStateClass.maybeMine);

        if ( neighbourTile.hasClass(s.tileStateClass.markedMine) ) {

          if ($.inArray(value, s.setMines) === -1) {
            neighbourTile.addClass(s.tileStateClass.mineWrong);
          }

        } else if ($.inArray(value, window.setMines) !== -1) {

          neighbourTile.removeClass(s.tileStateClass.initialised).addClass(s.tileStateClass.mineFound);
          $('.' + s.tileClass).off('mouseup');
          self.stopGame('lose');

        } else {

          neighbourTile.removeClass(s.tileStateClass.initialised).addClass(s.tileStateClass.released);
          self.isGameOverYet();
          s.releasedTiles[window.releasedTilesCount] = value;
          s.releasedTilesCount++;

          var
            countCloseMines = self.countNeighbourMines(value, false);

          if (countCloseMines > 0 && countCloseMines < 9) {
            neighbourTile.addClass(s.noOfNearMinesClass.prepend + s.noOfNearMinesClass[countCloseMines]).append(countCloseMines);
          } else if (countCloseMines === 0) {
            neighbourTile.off('mouseup');
            noMineTouching[noMineTouchingCount] = value;
            noMineTouchingCount++;
          }

        }
      });

      if (noMineTouchingCount > 0) {
        $.each(noMineTouching, function(index, value) {
          self.releaseNeighbours(value);
        });
      }
    };

    this.checkIsMine = function (tileId, countMarkedOnly)
    {
      if ($.inArray(tileId, this.settings.setMines) === -1) {
        return 0;
      }
      if (countMarkedOnly && !$('#' + tileId).hasClass(this.settings.tileStateClass.markedMine)) {
        return 0;
      }

      return 1;

    };

    this.tileOnLeft = function (tileId)
    {
      return (
      this.directionalTileId(tileId, 'right') > 0
      &&
      (tileId % this.settings.countAcross) !== 1
      );
    };

    this.tileOnRight = function (tileId)
    {
      return (
      this.directionalTileId(tileId, 'right') <= this.settings.noOfTiles
      &&
      (tileId % this.settings.countAcross) !== 0
      );
    };

    this.tileAbove = function (tileId)
    {
      return (this.directionalTileId(tileId, 'above') > 0);
    };

    this.tileBelow = function (tileId)
    {
      return ( this.directionalTileId(tileId, 'below') <= this.settings.noOfTiles);
    };

    this.directionalTileId = function (tileId, direction)
    {
      switch (direction) {
        case 'left':
          return tileId - 1;
          break;
        case 'right':
          return tileId + 1;
          break;
        case 'top':
          return tileId - this.settings.countAcross;
          break;
        case 'bottom':
          return tileId + this.settings.countAcross;
          break;
        case 'topleft':
          return (tileId - this.settings.countAcross - 1);
          break;
        case 'topright':
          return (tileId - this.settings.countAcross + 1);
          break;
        case 'bottomleft':
          return (tileId + this.settings.countAcross + 1);
          break;
        case 'bottomright':
          return (tileId + this.settings.countAcross - 1);
          break;
        default:
          return
      }
    };

    this.countNeighbourMines = function ( tileId, countMarkedOnly )
    {
      var
        s               = this.settings,
        countNMs        = 0,
        tempTileId      = 0,
        neighboursAbove = false,
        neighboursBelow = false,
        neighboursLeft  = false,
        neighboursRight = false;

      if ($.type(countMarkedOnly) !== 'boolean') {
        countMarkedOnly = false;
      }

      /** CHECK HORIZONTAL AND VERTICAL TILES */

      // check if there is a tile to the LEFT and increment counter if it has been marked as a mine
      if ( this.tileOnLeft(tileId) ) {
        neighboursLeft = true;
        countNMs += this.checkIsMine( this.directionalTileId(tileId, 'left'), countMarkedOnly );
      }

      // check if there is a tile to the RIGHT and increment counter if it has been marked as a mine
      if ( this.tileOnRight(tileId) ) {
        neighboursRight = true;
        countNMs += this.checkIsMine( this.directionalTileId(tileId, 'right'), countMarkedOnly);
      }

      // check if there is a tile ABOVE and increment counter if it has been marked as a mine
      if ( this.tileAbove(tileId) ) {
        neighboursAbove = true;
        countNMs += this.checkIsMine( this.directionalTileId(tileId, 'above'), countMarkedOnly);
      }

      // check if there is a tile BELOW and increment counter if it has been marked as a mine
      if ( this.tileBelow(tileId) ) {
        neighboursBelow = true;
        countNMs += this.checkIsMine( this.directionalTileId(tileId, 'below'), countMarkedOnly);
      }

      /** FINISHED CHECKING HORIZONTAL AND VERTICAL TILES */


      /** CHECK DIAGONAL TILES */

      // check LEFT diagonal tiles
      if (neighboursLeft) {
        // check TOP LEFT tile
        if (neighboursAbove) {
          countNMs += this.checkIsMine( this.directionalTileId(tileId, 'topleft'), countMarkedOnly);
        }
        // check BOTTOM LEFT tile
        if (neighboursBelow) {
          countNMs += this.checkIsMine( this.directionalTileId(tileId, 'bottomleft'), countMarkedOnly);
        }
      }

      // check RIGHT diagonal tiles
      if (neighboursRight) {
        // check TOP RIGHT tile
        if (neighboursAbove) {
          countNMs += this.checkIsMine( this.directionalTileId(tileId, 'topright'), countMarkedOnly);
        }
        // check BOTTOM RIGHT tile
        if (neighboursBelow) {
          countNMs += this.checkIsMine( this.directionalTileId(tileId, 'bottomright'), countMarkedOnly);
        }
      }

      /** END OF DIAGONAL TILE CHECKS */

      return countNMs;
    };


    this.getNeighbourIds = function (tileId)
    {
      var
        s               = this.settings,
        neighbourIds    = [],
        tempTileId      = 0,
        neighboursAbove = false,
        neighboursBelow = false,
        neighboursLeft  = false,
        neighboursRight = false;

      /** CHECK HORIZONTAL AND VERTICAL TILES */

        // store tile id if there is a tile to the LEFT of the target tile and it has not yet been released
        // if there are tiles to the LEFT - store this for diagonal checks later (see neighboursLeft)
      tempTileId = tileId - 1;
      if (tempTileId > 0 && (tileId % s.countAcross) !== 1) {
        neighboursLeft = true;
        if ($.inArray((tempTileId), s.releasedTiles) === -1) {
          neighbourIds.push(tempTileId);
        }
      }

      // store tile id if there is a tile to the RIGHT of the target tile and it has not yet been released
      // if there are tiles to the RIGHT - store this for diagonal checks later (see neighboursRight)
      tempTileId = tileId + 1;
      if (tempTileId <= s.noOfTiles && (tempTileId % s.countAcross) !== 0) {
        neighboursRight = true;
        if( $.inArray(tempTileId, s.releasedTiles) === -1) {
          neighbourIds.push(tempTileId);
        }
      }

      // store tile id if there is a tile ABOVE the target tile and it has not yet been released
      // if there are tiles ABOVE - store this for diagonal checks later (see neighboursAbove)
      tempTileId = tileId - s.countAcross;
      if (tempTileId > 0) {
        neighboursAbove = true;
        if ($.inArray(tempTileId, s.releasedTiles) === -1) {
          neighbourIds.push(tempTileId);
        }
      }

      // store tile id if there is a tile BELOW the target tile and it has not yet been release
      // if there are tiles BELOW - store this for diagonal checks later (see neighboursBelow)
      tempTileId = tileId + s.countAcross;
      if(tempTileId <= s.noOfTiles) {
        neighboursBelow = true;
        if ($.inArray(tempTileId, s.releasedTiles) === -1) {
          neighbourIds.push(tileId + s.countAcross);
        }
      }

      /** FINISHED CHECK OF HORIZONTAL AND VERTICAL TILES */


      /** CHECK DIAGONALS TILES WHERE POSSIBLE */

      // check LEFT DIAGONALS
      if (neighboursLeft) {

        // check diagonal - TOP/LEFT
        // if there are neighbour tiles to the LEFT and ABOVE - check the tile to the TOP LEFT of the target
        tempTileId = tileId - s.countAcross - 1;
        if (neighboursAbove && $.inArray(tempTileId, s.releasedTiles) === -1) {
          neighbourIds.push(tempTileId);
        }

        // check diagonal - BOTTOM/LEFT
        // if there are neighbour tiles to the LEFT and BELOW - check the tile to the BOTTOM LEFT of the target
        tempTileId = tileId + s.countAcross - 1;
        if (neighboursBelow && $.inArray(tempTileId, s.releasedTiles) === -1) {
          neighbourIds.push(tempTileId);
        }

      }

      // check RIGHT DIAGONALS
      if (neighboursRight) {

        // check diagonal - TOP/RIGHT
        // if there are neighbour tiles to the RIGHT and ABOVE - check the tile to the TOP RIGHT of the target
        tempTileId = tileId - s.countAcross + 1;
        if (neighboursAbove && $.inArray(tempTileId, s.releasedTiles) === -1) {
          neighbourIds.push(tempTileId);
        }

        // check diagonal - BOTTOM/RIGHT
        // if there are neighbour tiles to the RIGHT and BELOW - check the tile to the BOTTOM RIGHT of the target
        tempTileId = tileId + s.countAcross + 1;
        if (neighboursBelow && $.inArray(tempTileId, s.releasedTiles) === -1) {
          neighbourIds.push(tempTileId);
        }

      }

      /** FINISHED CHECK OF DIAGONAL TILES */

      return neighbourIds;
    };


    this.stopGame = function (winLose)
    {
      var
        self = this;

      self.stopTimer();
      if (winLose === 'lose') {
        setTimeout(function()
        {
          self.newGameImageChange('sad');
        }, 100);
        self.addVeil('lose');
      } else {
        self.addVeil('win');
      }
    };

    this.startGame = function ()
    {
      var
        self = this,
        s    = this.settings;

      self.timerStarted = true;
      self.timerId = setInterval(function()
      {
        s.timer++;
        switch (s.timer.toString().length) {

          case 1:
            $('#timer img:nth-child(1)').attr('src','img/0.png');
            $('#timer img:nth-child(2)').attr('src','img/0.png');
            $('#timer img:nth-child(3)').attr('src','img/' + s.timer + '.png');
            break;

          case 2:
            var digits = s.timer.toString().split('');
            $('#timer img:nth-child(1)').attr('src', 'img/0.png');
            $('#timer img:nth-child(2)').attr('src', 'img/' + digits[0] + '.png');
            $('#timer img:nth-child(3)').attr('src', 'img/' + digits[1] + '.png');
            break;

          case 3:
            var digits = s.timer.toString().split('');
            $('#timer img:nth-child(1)').attr('src', 'img/' + digits[0] + '.png');
            $('#timer img:nth-child(2)').attr('src', 'img/' + digits[1] + '.png');
            $('#timer img:nth-child(3)').attr('src', 'img/' + digits[2] + '.png');
            break;

          default:
            stopTimer();
            $('#timer img').each(function()
            {
              $(this).attr('src', 'img/9.png');
            });
        }
      },1000);
    };

    this.isGameOverYet = function ()
    {
      var
        s = this.settings;

      if ($('.' + s.tileStateClass.released).length === (s.noOfTiles - s.noOfMines)) {
        this.stopGame('win');
      }
    };

    this.releaseNeighbours = function ( tileId )
    {
      var
        self            = this,
        s               = this.settings,
        tileNeighbours  = this.getNeighbourIds(tileId);

      $.each(tileNeighbours, function(index, value)
      {
        var
          neighbourTile = $('#' + value);

        if ( $.inArray(value, s.releasedTiles) === -1) {
          if (!neighbourTile.hasClass(s.tileStateClass.markedMine) && !neighbourTile.hasClass(s.tileStateClass.released)) {

            neighbourTile.removeClass(s.tileStateClass.maybeMine);
            neighbourTile.removeClass(s.tileStateClass.initialised).addClass(s.tileStateClass.released);
            self.isGameOverYet();
            s.releasedTiles[window.releasedTilesCount] = value;
            s.releasedTilesCount++;

            var
              countCloseMines = self.countNeighbourMines(value, false);

            if (countCloseMines > 0 && countCloseMines < 9) {

              neighbourTile.addClass(s.noOfNearMinesClass.prepend + s.noOfNearMinesClass[countCloseMines]).append(countCloseMines);

            } else {

              neighbourTile.off('mouseup');
              self.releaseNeighbours(value);

            }
          }
        }
      });
    };


    this.stopTimer = function ()
    {
      clearInterval(this.settings.timerId);
    };


    this.addVeil = function (winLose)
    {
      var
        minefieldClass = 'beginner',
        s = this.settings;

      switch(s.gameType) {

        case 3:
          minefieldClass = 'advanced';
          break;

        case 2:
          minefieldClass = 'intermediate';
          break;

        default:

      }

      $('body').prepend('<div id="' + s.veilDivId + '" class="hidden ' + minefieldClass + '"></div><div id="' + s.veilTextId + '" style="display:none;"><span></span></div>');

      if (winLose === 'win') {
        $('#' + s.veilTextId + ' span').append('You Won!');
      } else {
        $('#' + s.veilTextId + ' span').append('You Hit A Mine!');
      }

      this.positionVeil();
      $('#' + s.veilDivId + ',#' + s.veilTextId).fadeIn('fast');
    }

  };






  var ConsoleLogger = function ( debugInConsole )
  {
    this.debug = debugInConsole;

    this.log = function( message )
    {
      if ( this.debug ) {
        window.console && console.log( message );
      }
    };

    this.typeCheck = function ( checkVariable, expectedType, equalTo, message )
    {
      if ( equalTo ) {

        if ( $.type(checkVariable ) === expectedType ) {
          this.log( message );
          return false;
        }

      } else {

        if ( $.type(checkVariable ) !== expectedType ) {
          this.log( message );
          return false;
        }

      }

      return true;

    };



  }

}( jQuery ));

/*
 window.gameType = 1;
 window.countAcross;
 window.countDown;
 window.noOfTiles;
 window.noOfMines;
 window.countNoOfMines;
 window.setMines = [];
 window.timerStarted;
 window.timerId;
 window.timer;
 window.releasedTiles;
 window.tileNeighbours;
 window.releasedTilesCount;
 window.tileNeighboursCount;
 window.leftClickTimeStamp;
 window.rightClickTimeStamp;

 function positionGame()
 {
 $('#game').css('left',(($(window).width()/2)-($('#game').width()/2))+'px');
 }

 function positionVeil()
 {
 if ($('#veil').length>0) {
 var minefieldOffset = $('#minefield').offset();
 $('#veil').css('top',minefieldOffset.top+'px').css('left',minefieldOffset.left+'px');
 var veilTextTop = minefieldOffset.top + ($('#minefield').height()/2) - 40;
 var veilTextLeft = minefieldOffset.left+($('#minefield').width()/2) - ($('#veil-text').width()/2);
 $('#veil-text').css('top', veilTextTop + 'px').css('left', veilTextLeft + 'px');
 }
 }

 function updateMinesLeft()
 {
 var mineCounter = 0;

 switch (window.minesLeft.toString().length) {

 case 1:
 $('#unmarked-mines img').each(function()
 {
 mineCounter++;
 if (mineCounter < 3) {
 $(this).attr('src','img/0.png');
 } else {
 $(this).attr('src', 'img/' + window.minesLeft + '.png');
 }
 });
 break;

 case 2:
 var digitsMinesLeft = window.minesLeft.toString().split('');
 $('#unmarked-mines img').each(function()
 {
 mineCounter++;
 if (mineCounter < 2) {
 $(this).attr('src','img/0.png');
 } else {
 $(this).attr('src','img/' + digitsMinesLeft[mineCounter-2] + '.png');
 }
 });
 break;

 default:
 var digitsMinesLeft = window.minesLeft.toString().split('');
 $('#unmarked-mines img').each(function()
 {
 $(this).attr('src','img/' + digitsMinesLeft[mineCounter] + '.png');
 mineCounter++;
 });
 }
 }

 function newGameImageChange(face)
 {
 $('#new-game-icon img').attr('src', 'img/new-game-' + face + '.png');

 if (face === 'uh-oh') {
 setTimeout(function()
 {
 $('#new-game-icon img').attr('src', 'img/new-game-happy.png');
 }, 100);
 }
 }

 function startGame()
 {
 window.timerStarted = true;
 window.timerId = setInterval(function()
 {
 window.timer++;
 switch (window.timer.toString().length) {

 case 1:
 $('#timer img:nth-child(1)').attr('src','img/0.png');
 $('#timer img:nth-child(2)').attr('src','img/0.png');
 $('#timer img:nth-child(3)').attr('src','img/' + window.timer + '.png');
 break;

 case 2:
 var digits = window.timer.toString().split('');
 $('#timer img:nth-child(1)').attr('src', 'img/0.png');
 $('#timer img:nth-child(2)').attr('src', 'img/' + digits[0] + '.png');
 $('#timer img:nth-child(3)').attr('src', 'img/' + digits[1] + '.png');
 break;

 case 3:
 var digits = window.timer.toString().split('');
 $('#timer img:nth-child(1)').attr('src', 'img/' + digits[0] + '.png');
 $('#timer img:nth-child(2)').attr('src', 'img/' + digits[1] + '.png');
 $('#timer img:nth-child(3)').attr('src', 'img/' + digits[2] + '.png');
 break;

 default:
 stopTimer();
 $('#timer img').each(function()
 {
 $(this).attr('src', 'img/9.png');
 });
 }
 },1000);
 }

 function stopTimer()
 {
 clearInterval(window.timerId);
 }

 function addVeil(winLose)
 {
 var minefieldClass='';

 switch(window.gameType) {

 case 1:
 minefieldClass = 'beginner';
 break;

 case 2:
 minefieldClass = 'intermediate';
 break;

 default:
 minefieldClass = 'advanced';

 }

 $('body').prepend('<div id="veil" class="hidden ' + minefieldClass + '"></div><div id="veil-text" class="hidden"><span></span></div>');

 if (winLose === 'win') {
 $('#veil-text span').append('You Won!');
 } else {
 $('#veil-text span').append('You Hit A Mine!');
 }

 positionVeil();
 $('#veil').fadeIn('fast');
 $('#veil-text').fadeIn('fast');
 }

 function stopGame(winLose)
 {
 stopTimer();
 if (winLose === 'lose') {
 setTimeout(function()
 {
 newGameImageChange('sad');
 }, 100);
 addVeil('lose');
 } else {
 addVeil('win');
 }
 }

 function isGameOverYet()
 {
 if ($('.tile-released').length === (window.noOfTiles - window.noOfMines)) {
 stopGame('win');
 }
 }

 function getNeighbourIds(tileId)
 {
 var
 neighbourIds = [],
 countNs = 0,
 neighboursAbove = false,
 neighboursBelow = false,
 neighboursLeft = false,
 neighboursRight = false;

 if ((tileId-1) > 0 && (tileId % window.countAcross) !== 1) {
 neighboursLeft = true;
 if ($.inArray((tileId-1), window.releasedTiles) === -1) {
 neighbourIds[countNs] = (tileId - 1);
 countNs++;
 }
 }

 if ((tileId + 1) <= window.noOfTiles && (tileId % window.countAcross) !== 0) {
 neighboursRight = true;
 if( $.inArray((tileId + 1), window.releasedTiles) === -1) {
 neighbourIds[countNs] = (tileId + 1);
 countNs++;
 }
 }

 if ((tileId - window.countAcross) > 0) {
 neighboursAbove = true;
 if ($.inArray((tileId - window.countAcross), window.releasedTiles) === -1) {
 neighbourIds[countNs] = (tileId - window.countAcross);
 countNs++;
 }
 }

 if((tileId + window.countAcross) <= window.noOfTiles) {
 neighboursBelow = true;
 if ($.inArray((tileId + window.countAcross), window.releasedTiles) === -1) {
 neighbourIds[countNs] = (tileId + window.countAcross);
 countNs++;
 }
 }

 if (neighboursLeft && neighboursAbove && $.inArray((tileId - window.countAcross - 1), window.releasedTiles) === -1) {
 neighbourIds[countNs] = (tileId - window.countAcross - 1);
 countNs++;
 }

 if (neighboursRight && neighboursAbove && $.inArray((tileId - window.countAcross + 1), window.releasedTiles) === -1) {
 neighbourIds[countNs] = (tileId - window.countAcross + 1);
 countNs++;
 }

 if (neighboursLeft && neighboursBelow && $.inArray((tileId + window.countAcross - 1), window.releasedTiles) === -1) {
 neighbourIds[countNs] = (tileId + window.countAcross - 1);
 countNs++;
 }

 if (neighboursRight && neighboursBelow && $.inArray((tileId + window.countAcross + 1), window.releasedTiles) === -1) {
 neighbourIds[countNs] = (tileId + window.countAcross + 1);
 countNs++;
 }

 return neighbourIds;
 }

 function releaseNeighbours(tileId)
 {
 var
 tileNeighbours = getNeighbourIds(tileId);

 $.each(tileNeighbours, function(index, value)
 {
 if ($.inArray(value, window.releasedTiles) === -1) {
 if (!$('#' + value).hasClass('marked-mine') && !$('#' + value).hasClass('tile-released')) {
 if ($('#'+value).hasClass('maybe-mine')) {
 $('#'+value).removeClass('maybe-mine');
 }
 $('#' + value).removeClass('tile-initialised').addClass('tile-released');
 isGameOverYet();
 window.releasedTiles[window.releasedTilesCount] = value;
 window.releasedTilesCount++;

 var
 countCloseMines = countNeighbourMines(value);

 if (countCloseMines > 0 && countCloseMines < 9) {
 $('#' + value).addClass('touching-mines').addClass('nmc-' + countCloseMines).append(countCloseMines);
 } else if(countCloseMines === 0) {
 $('#' + value).off('mouseup');
 releaseNeighbours(value);
 }
 }
 }
 });
 }

 function countNeighbourMines(tileId)
 {
 var
 countNMs = 0,
 neighboursAbove = false,
 neighboursBelow = false,
 neighboursLeft = false,
 neighboursRight = false;

 if ((tileId - 1) > 0 && (tileId % window.countAcross) !== 1) {
 neighboursLeft = true;
 if ($.inArray((tileId - 1), window.setMines) !== -1) {
 countNMs++;
 }
 }

 if ((tileId + 1) <= window.noOfTiles && (tileId % window.countAcross) !== 0) {
 neighboursRight = true;
 if ($.inArray((tileId + 1), window.setMines) !== -1) {
 countNMs++;
 }
 }

 if ((tileId - window.countAcross) > 0) {
 neighboursAbove = true;
 if ($.inArray((tileId - window.countAcross), window.setMines) !== -1) {
 countNMs++;
 }
 }

 if ((tileId + window.countAcross) <= window.noOfTiles) {
 neighboursBelow = true;
 if ($.inArray((tileId + window.countAcross), window.setMines) !== -1) {
 countNMs++;
 }
 }

 if (neighboursLeft && neighboursAbove) {
 if ($.inArray((tileId - window.countAcross - 1), window.setMines) !== -1) {
 countNMs++;
 }
 }

 if (neighboursRight && neighboursAbove) {
 if ($.inArray((tileId - window.countAcross + 1), window.setMines) !== -1) {
 countNMs++;
 }
 }

 if (neighboursLeft && neighboursBelow) {
 if ($.inArray((tileId + window.countAcross - 1), window.setMines) !== -1) {
 countNMs++;
 }
 }

 if (neighboursRight && neighboursBelow) {
 if ($.inArray((tileId + window.countAcross + 1), window.setMines) !== -1) {
 countNMs++;
 }
 }

 return countNMs;
 }

 function countMarkedNeighbourMines(tileId)
 {
 var
 countMNMs = 0,
 neighboursAbove = false,
 neighboursBelow = false,
 neighboursLeft = false,
 neighboursRight = false;

 if ((tileId - 1) > 0 && (tileId % window.countAcross) !== 1) {
 neighboursLeft = true;
 if ($('#' + (tileId - 1)).hasClass('marked-mine')) {
 countMNMs++;
 }
 }

 if ((tileId + 1) <= window.noOfTiles && (tileId % window.countAcross) !== 0) {
 neighboursRight = true;
 if ($('#' + (tileId + 1)).hasClass('marked-mine')) {
 countMNMs++;
 }
 }

 if ((tileId - window.countAcross) > 0) {
 neighboursAbove = true;
 if ($('#' + (tileId - window.countAcross)).hasClass('marked-mine')) {
 countMNMs++;
 }
 }

 if ((tileId + window.countAcross) <= window.noOfTiles) {
 neighboursBelow = true;
 if ($('#' + (tileId + window.countAcross)).hasClass('marked-mine')) {
 countMNMs++;
 }
 }

 if (neighboursLeft && neighboursAbove) {
 if ($('#' + (tileId - window.countAcross - 1)).hasClass('marked-mine')) {
 countMNMs++;
 }
 }

 if (neighboursRight && neighboursAbove) {
 if ($('#' + (tileId - window.countAcross + 1)).hasClass('marked-mine')) {
 countMNMs++;
 }
 }

 if (neighboursLeft && neighboursBelow) {
 if ($('#' + (tileId + window.countAcross - 1)).hasClass('marked-mine')) {
 countMNMs++;
 }
 }

 if (neighboursRight && neighboursBelow) {
 if ($('#' + (tileId + window.countAcross + 1)).hasClass('marked-mine')) {
 countMNMs++;
 }
 }

 return countMNMs;
 }

 function releaseTilesNotMarked(tileId)
 {
 var
 neighbourTiles = getNeighbourIds(tileId),
 noMineTouching = [],
 noMineTouchingCount = 0;

 $.each(neighbourTiles, function(index, value)
 {
 if ($('#' + value).hasClass('maybe-mine')) {
 $('#' + value).removeClass('maybe-mine');
 }

 if ($('#' + value).hasClass('marked-mine') && $.inArray(value, window.setMines) !== -1) {

 } else if ($('#' + value).hasClass('marked-mine') && $.inArray(value, window.setMines) === -1) {
 $('#' + value).addClass('mine-wrong');
 } else if (!$('#' + value).hasClass('marked-mine') && $.inArray(value, window.setMines) !== -1) {
 $('#' + value).removeClass('tile-initialised').addClass('mine-found');
 $('.tile').off('mouseup');
 stopGame('lose');
 } else {
 $('#' + value).removeClass('tile-initialised').addClass('tile-released');
 isGameOverYet();
 window.releasedTiles[window.releasedTilesCount] = value;
 window.releasedTilesCount++;
 var
 countCloseMines = countNeighbourMines(value);

 if (countCloseMines > 0 && countCloseMines < 9) {
 $('#' + value).addClass('touching-mines').addClass('nmc-' + countCloseMines).append(countCloseMines);
 } else if (countCloseMines === 0) {
 $('#' + value).off('mouseup');
 noMineTouching[noMineTouchingCount] = value;
 noMineTouchingCount++;
 }
 }
 });

 if (noMineTouchingCount > 0) {
 $.each(noMineTouching, function(index, value) {
 releaseNeighbours(value);
 });
 }
 }

 function leftClick(tileId)
 {
 if (!$('#' + tileId).hasClass('marked-mine') && !$('#' + tileId).hasClass('tile-released')) {
 if ($('#'+tileId).hasClass('maybe-mine')) {
 $('#'+tileId).removeClass('maybe-mine');
 }
 if ($.inArray(tileId,window.setMines) !== -1) {
 $('#' + tileId).addClass('mine-found');
 $('.tile').off('mouseup');
 stopGame('lose');
 } else {
 newGameImageChange('uh-oh');
 $('#' + tileId).addClass('tile-released');
 isGameOverYet();
 window.releasedTiles[window.releasedTilesCount] = tileId;
 window.releasedTilesCount++;
 if (!window.timerStarted) {
 startGame();
 }
 var
 countCloseMines = countNeighbourMines(tileId);

 if (countCloseMines > 0 && countCloseMines < 9) {
 $('#' + tileId).addClass('touching-mines').addClass('nmc-' + countCloseMines).append(countCloseMines);
 } else if (countCloseMines === 0) {
 $('#' + tileId).off('mouseup');
 releaseNeighbours(tileId);
 }
 }
 }
 }

 function rightClick(tileId)
 {
 if (!$('#' + tileId).hasClass('tile-released')) {
 if ($('#'+tileId).hasClass('marked-mine')) {
 $('#'+tileId).removeClass('marked-mine');
 $('#'+tileId).addClass('maybe-mine');
 window.minesLeft++;
 } else if ($('#' + tileId).hasClass('maybe-mine')) {
 $('#' + tileId).removeClass('maybe-mine');
 } else {
 $('#' + tileId).addClass('marked-mine');
 window.minesLeft--;
 if (!window.timerStarted) {
 startGame();
 }
 }
 updateMinesLeft();
 }
 }

 function middleClick(tileId) {
 newGameImageChange('uh-oh');
 if (
 $('#' + tileId).hasClass('tile-released')
 &&
 (
 $('#' + tileId).hasClass('nmc-1')
 ||
 $('#' + tileId).hasClass('nmc-2')
 ||
 $('#' + tileId).hasClass('nmc-3')
 ||
 $('#' + tileId).hasClass('nmc-4')
 ||
 $('#' + tileId).hasClass('nmc-5')
 ||
 $('#' + tileId).hasClass('nmc-6')
 ||
 $('#' + tileId).hasClass('nmc-7')
 ||
 $('#' + tileId).hasClass('nmc-8')
 )
 ) {
 var
 noOfCloseMines = 0,
 classList = $('#' + tileId).attr('class').split(' ');

 $.each(classList, function(index, value) {
 if (value.indexOf('nmc-') !== -1) {
 noOfCloseMines = parseInt(value.replace('nmc-', ''));
 }
 });

 if (noOfCloseMines <= countMarkedNeighbourMines(tileId)) {
 releaseTilesNotMarked(tileId);
 }
 }
 }

 function setMineClickAction()
 {
 $('.tile').each(function()
 {
 $(this).mousedown(function(ev)
 {
 if (ev.which === 1) {
 if ($(this).hasClass('tile-initialised')) {
 $(this).removeClass('tile-initialised');
 var
 currentTileId = $(this).attr('id');
 $(this).mouseleave(function()
 {
 setTimeout(function()
 {
 if (!$('#' + currentTileId).hasClass('tile-released')) {
 $('#' + currentTileId).addClass('tile-initialised');
 }
 }, 15);
 });
 }
 }
 });

 $(this).mouseup(function(event)
 {
 var
 tileId = parseInt($(this).attr('id'));

 switch (parseInt(event.which)) {

 case 1:
 if ($(this).hasClass('tile-initialised')) {
 $(this).removeClass('tile-initialised');
 }
 window.leftClickTimeStamp = new Date().getTime();
 var
 difference = 0,
 msDifference = 0;

 if (window.rightClickTimeStamp !== -1) {
 difference = window.leftClickTimeStamp - window.rightClickTimeStamp;
 }

 if (difference > 0 && difference < 21) {
 middleClick(tileId);
 } else {
 setTimeout(function()
 {
 if (window.rightClickTimeStamp !== -1) {
 msDifference = rightClickTimeStamp - leftClickTimeStamp;
 }

 if (msDifference > 0 && msDifference < 21) {
 middleClick(tileId);
 } else {
 leftClick(tileId);
 }
 }, 20);
 }
 break;

 case 3:
 window.rightClickTimeStamp = new Date().getTime();
 var
 difference = 0,
 msDifference = 0;

 if (window.leftClickTimeStamp !== -1) {
 difference = window.rightClickTimeStamp - window.leftClickTimeStamp;
 }

 if (difference <= 0 || difference > 20) {
 setTimeout(function()
 {
 if (window.leftClickTimeStamp !== -1) {
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
 });
 });
 }

 function setRandomMines()
 {
 var
 randomTile,
 alreadyExists = false;
 window.setMines = [];

 while (window.countNoOfMines < window.noOfMines) {
 randomTileId = Math.floor(Math.random() * window.noOfTiles) + 1;
 if (window.setMines.length > 0) {
 alreadyExists = false;
 $.each(window.setMines, function(index, value) {
 if (value === randomTileId) {
 alreadyExists = true;
 }
 });

 if (!alreadyExists) {
 window.setMines[window.countNoOfMines] = randomTileId;
 window.countNoOfMines++;
 }
 } else {
 window.setMines[0] = randomTileId;
 window.countNoOfMines++;
 }
 }
 }

 function changeMinefieldClass(nextGameType)
 {
 if ($('#minefield').attr('class') !== undefined) {
 $('#minefield').attr('class', '');
 }
 $('#minefield').addClass(nextGameType);
 }

 function changeHeaderClass(nextHeaderType)
 {
 if ($('#header').attr('class') !== undefined) {
 $('#header').attr('class','');
 }
 $('#header').addClass(nextHeaderType);
 }

 function buildMineField()
 {
 $('#header-info').empty().append('<div id="unmarked-mines" class="digital-numbers"><img src="img/0.png" /><img src="img/0.png" /><img src="img/0.png" /></div>' +
 '<div id="new-game-icon"><img src="img/new-game-happy.png" /></div><div id="timer" class="digital-numbers"><img src="img/0.png" /><img src="img/0.png" /><img src="img/0.png" /></div>');

 $('#minefield').empty();

 switch (window.gameType) {
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

 for (var i = 1; i <= window.noOfTiles; i++) {
 $('#minefield').append('<div id="' + i + '" class="tile"></div>');
 }

 setRandomMines();
 $('.tile').addClass('tile-initialised');
 setMineClickAction();
 positionGame();
 }

 function initialiseGame(gameLevel)
 {
 if ($('#veil').length > 0) {
 $('#veil,#veil-text').remove();
 }

 if (window.timerStarted) {
 stopTimer();
 window.timerId=null;
 }

 window.gameType = gameLevel;
 $('#options-drop-down .selected').removeClass('selected');

 switch (gameLevel) {

 case 2:
 window.countAcross = 16;
 window.countDown = 16;
 window.noOfMines = 40;
 $('body').attr('class','body-min-height-int-adv');
 $('#intermediate').addClass('selected');
 break;

 case 3:
 window.countAcross = 30;
 window.countDown = 16;
 window.noOfMines = 99;
 $('body').attr('class', 'body-min-height-int-adv');
 $('#advanced').addClass('selected');
 break;

 default:
 window.countAcross = 8;
 window.countDown = 8;
 window.noOfMines = 10;
 $('body').attr('class', 'body-min-height-beginner');
 $('#beginner').addClass('selected');
 }

 window.noOfTiles = window.countAcross * window.countDown;
 window.minesLeft = window.noOfMines;
 window.countNoOfMines = 0;
 window.timerStarted = false;
 window.timer = 0;
 window.releasedTiles = [];
 window.releasedTilesCount = 0;
 window.leftClickTimeStamp = -1;
 window.rightClickTimeStamp =-1;
 buildMineField();
 }

 function preloadImages()
 {
 var imgString = '';
 for (var i = 2; i < 10; i++) {
 imgString += '<img src="img/' + i + '.png" class="hidden" />';
 }

 imgString += '<img src="img/maybe-mine.png" class="hidden" /><img src="img/mine-found.png" class="hidden" />' +
 '<img src="img/mine-wrong.png" class="hidden" /><img src="img/new-game-sad.png" class="hidden" />' +
 '<img src="img/new-game-uh-oh.png" class="hidden" />';
 $('body').append(imgString);}

 $(document).ready(function()
 {
 preloadImages();
 initialiseGame(1);
 $('body').bind('contextmenu', function(e)
 {
 return false;
 });
 $('#new-game-icon').on('click', function()
 {
 initialiseGame(window.gameType);
 });
 $('#new-game').click(function()
 {
 $('#options-drop-down').hide();
 initialiseGame(window.gameType);
 });
 $('#beginner').click(function()
 {
 $('#options-drop-down').hide();
 initialiseGame(1);
 });
 $('#intermediate').click(function()
 {
 $('#options-drop-down').hide();
 initialiseGame(2);
 });
 $('#advanced').click(function()
 {
 $('#options-drop-down').hide();
 initialiseGame(3);
 });
 $('body').attr('unselectable', 'on').css({'UserSelect': 'none', 'MozUserSelect': 'none'}).on('selectstart', false);
 $(window).resize(function()
 {
 positionGame();
 positionVeil();
 });
 $('#options').click(function(event)
 {
 if ($('#options-drop-down').is(':visible')) {
 $('#options-drop-down').slideUp('fast');
 event.stopPropagation();
 } else {
 $('#options-drop-down').slideDown('fast');
 event.stopPropagation();
 }
 });
 $('.swp').click(function(e)
 {
 e.stopPropagation();
 });
 $(window).click(function()
 {
 if ($('#options-drop-down').is(':visible')) {
 $('#options-drop-down').slideUp('fast');
 }
 });
 });
 */
