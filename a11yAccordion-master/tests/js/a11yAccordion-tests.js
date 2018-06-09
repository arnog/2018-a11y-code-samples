/* global beforeEach, afterEach, _, $, it, describe, chai, a11yAccordion */

(function (expect) {
  describe('a11yAccordion tests', function() {

    this.timeout(1500);

    var testaccordionId = '#accordion1';
    var hiddenLinkDescription = 'Hidden Link Description';

    var testOptions = {
      parentSelector: testaccordionId,
      hiddenLinkDescription: hiddenLinkDescription,
      speed: 1
    };

    var accordionCleanUp = function() {
      $(testaccordionId).empty();
    };

    var generateaccordionMarkup = function() {
      accordionCleanUp();
      var markup = $(testaccordionId);
      var rows = [];

      for (var i=0; i < 5; ++i) {
        var row = $('<li>', {
          'class': 'a11yAccordionItem'
        });

        $('<div>', {
          'class': 'a11yAccordionItemHeader',
          text: 'Header ' + i
        }).appendTo(row);

        $('<div>', {
          'class': 'a11yAccordionHideArea',
          text: 'Item ' + i
        }).appendTo(row);

        rows.push(row);
      }

      markup.prepend(rows);
    };

    var checkVisibility = function(a11yAccordion, rowIndex, isVisible) {
      var header = a11yAccordion.refs.headers.eq(rowIndex);
      var hiddenArea = a11yAccordion._getHiddenArea(rowIndex);

      expect(header.find(a11yAccordion.props.selectors.showHeaderLabelSelector)
        .css('display') != 'none').to.equal(!isVisible);
      expect(header.find(a11yAccordion.props.selectors.hideHeaderLabelSelector)
        .css('display') != 'none').to.equal(isVisible);
      expect(hiddenArea.css('display') != 'none').to.equal(isVisible);

      expect(hiddenArea.hasClass(a11yAccordion.props.classes.visibleAreaClass))
        .to.equal(isVisible);
    };

    var checkTriangle = function(a11yAccordion, rowIndex, toggled) {
      expect($(a11yAccordion.refs.headers[rowIndex])
        .find('.a11yAccordion-triangle').hasClass('toggle')).to.equal(toggled);
    }

    beforeEach(generateaccordionMarkup);
    afterEach(accordionCleanUp);

    describe('a11yAccordion creation', function() {
      it('bad options. failed to create', function() {
        var testIndex = 0;

        var testCases = [
          {
            throwMessage: 'a11yAccordion - no element(s) with parentSelector was found',
            options: {
              parentSelector: undefined
            }
          },
          {
            throwMessage: 'a11yAccordion - no element(s) with accordionItemSelector was found',
            options: {
              parentSelector: '#accordion1',
              classes: {
                accordionItemClass: 'does not exist'
              }
            }
          },
          {
            throwMessage: 'a11yAccordion - no element(s) with headerSelector was found',
            options: {
              parentSelector: '#accordion1',
              classes: {
                accordionItemClass: 'a11yAccordionItem',
                headerClass: 'does not exist'
              }
            }
          },
          {
            throwMessage: 'a11yAccordion - no element(s) with hiddenAreaSelector was found',
            options: {
              parentSelector: '#accordion1',
              classes: {
                accordionItemClass: 'a11yAccordionItem',
                headerClass: 'a11yAccordionItemHeader',
                hiddenAreaClass: 'does not exist'
              }
            }
          },
          {
            throwMessage: 'a11yAccordion - invalid searchActionType. It can only be: hide or collapse',
            options: {
              parentSelector: '#accordion1',
              classes: {
                accordionItemClass: 'a11yAccordionItem',
                headerClass: 'a11yAccordionItemHeader',
                hiddenAreaClass: 'a11yAccordionHideArea'
              },
              searchActionType: 'does not exist'
            }
          }
        ];

        _.each(testCases, function(testCase) {
          try {
            new A11yAccordion(testCase.options);
          } catch (exception) {
            testIndex = testIndex + 1;
            expect(exception).to.equal(testCase.throwMessage);
          }
        });

        expect(testIndex).to.equal(testCases.length);
      });

      describe('good options. succeeded to create', function() {
        var hasSearchDiv = function(a11yAccordion) {
          return !!a11yAccordion.refs.el.find('.a11yAccordionSearch').length;
        };

        it('Default creation', function() {
          var a11yAccordion = new A11yAccordion(testOptions);
          var headerLinkHiddenEl, headerTextEl, row;

          expect(a11yAccordion.refs.el.attr('id')).to.equal('accordion1');
          expect(a11yAccordion.refs.accordionHideAreas.length).to.equal(5);
          hasSearchDiv(a11yAccordion, true);
          expect(a11yAccordion.refs.el
            .find(a11yAccordion.props.classes.visibleAreaClass)
            .filter(':visible').length).to.equal(0);

          row = a11yAccordion.getRowEl(1);
          expect(row.find(a11yAccordion.props.classes.visibleAreaClass)
            .filter(':visible').length).to.equal(0);

          checkVisibility(a11yAccordion, 1, false);

          headerTextEl = row.find('.a11yAccordionItemHeaderText');
          headerLinkHiddenEl = row.find('.a11yAccordionItemHeaderLinkHiddenLabel');

          expect(headerTextEl.length).to.equal(1);
          expect(headerTextEl.text()).to.equal('Header 1');

          expect(headerLinkHiddenEl.length).to.equal(1);
          expect(headerLinkHiddenEl.text()).to.equal('Hidden Link Description');

          expect(row.find('.a11yAccordion-triangle').length).to.equal(1);
        });

        it('Without search', function() {
          var customOptions = _.clone(testOptions, true);
          customOptions.showSearch = false;

          var a11yAccordion = new A11yAccordion(customOptions);

          hasSearchDiv(a11yAccordion, false);
        });

        it('With hiddenLinkDescription override', function() {
          // before creating accordion let's add an hiddenLinkDescription
          // override attribute to the first a11yAccordionItem
          var firstHeader = $(testaccordionId).find('.a11yAccordionItemHeader')[0];
          firstHeader.setAttribute('data-a11yAccordion-hiddenLinkDescription', 'Override Hidden Text');

          var a11yAccordion = new A11yAccordion(testOptions);

          var firstHiddenDescription = $(testaccordionId)
            .find('.a11yAccordionItemHeaderLinkHiddenLabel')[0];

          var secondHiddenDescription = $(testaccordionId)
            .find('.a11yAccordionItemHeaderLinkHiddenLabel')[1];

          expect(firstHiddenDescription.textContent).to.be.equal('Override Hidden Text');
          expect(secondHiddenDescription.textContent).to.be.equal('Hidden Link Description');
        });
      });
    });

    describe('Search functionality', function() {
      var triggerKeyUp = function(a11yAccordion, text, expectedNumberOfRows) {
        var el = a11yAccordion.refs.el;
        var searchInput = el.find('.a11yAccordionSearch');

        expect(!!searchInput.length).to.be.true;

        searchInput.val(text);
        searchInput.keyup();

        expect(el.find('.a11yAccordionItem').filter(':visible').length)
          .to.equal(expectedNumberOfRows);

        if (text.length) {
          expect(el.find('.a11yAccordion-markedText').length)
            .to.equal(expectedNumberOfRows);
        } else {
          expect(el.find('.a11yAccordion-markedText').length)
            .to.equal(0);
        }

        if (!expectedNumberOfRows) {
          expect(!!el.find('#a11yAccordion-noResultsItem').length).to.be.true;
        }
      };

      it('Regular search', function() {
        var a11yAccordion = new A11yAccordion(testOptions);

        triggerKeyUp(a11yAccordion, 'Do not exist', 0);
        triggerKeyUp(a11yAccordion, 'Header 3', 1);
        triggerKeyUp(a11yAccordion, 'Item 2', 0);
        triggerKeyUp(a11yAccordion, '', 5);
      });

      it('Overall search', function() {
        var customOptions = _.clone(testOptions, true);
        customOptions.overallSearch = true;
        var a11yAccordion = new A11yAccordion(customOptions);

        triggerKeyUp(a11yAccordion, 'Do not exist', 0);
        triggerKeyUp(a11yAccordion, 'Header 3', 1);
        triggerKeyUp(a11yAccordion, 'Item 3', 1);
        triggerKeyUp(a11yAccordion, '', 5);
      });

      it('Search with collapsable option', function() {
        var totalNumberOfRows = 5;

        var customOptions = _.clone(testOptions, true);
        customOptions.overallSearch = true;
        customOptions.searchActionType = 'collapse';
        var a11yAccordion = new A11yAccordion(customOptions);

        var triggerKeyUp = function(a11yAccordion, text, expectedNumberOfRows) {
          var el = a11yAccordion.refs.el;
          var searchInput = el.find('.a11yAccordionSearch');

          expect(!!searchInput.length).to.be.true;

          searchInput.val(text);
          searchInput.keyup();

          expect(el.find('.a11yAccordionItem').filter(':visible').length)
            .to.equal(totalNumberOfRows);

          expect(el.find('.a11yAccordionItem')
            .find('.a11yAccordionHideArea:visible').length
          ).to.equal(expectedNumberOfRows);

          if (text.length) {
            expect(el.find('.a11yAccordion-markedText').length)
              .to.equal(expectedNumberOfRows);
          } else {
            expect(el.find('.a11yAccordion-markedText').length)
              .to.equal(0);
          }

          if (!expectedNumberOfRows) {
            expect(!!el.find('#a11yAccordion-noResultsItem').length).to.be.true;
          }
        };

        triggerKeyUp(a11yAccordion, 'Do not exist', 0);
        triggerKeyUp(a11yAccordion, 'Item 3', 1);
        triggerKeyUp(a11yAccordion, '', 5);
      });
    });

    // Public
    describe('clicking on header', function() {
      it('regular functionality', function(done) {
        var customOptions = _.clone(testOptions, true);
        var index = 2;

        customOptions.onAreaShow = function(element) {
          expect(element.length).to.equal(1);
          checkVisibility(a11yAccordion, index, true);

          // Check that proper link is in focus
          var focusedEl = $(document.activeElement);

          expect(focusedEl.hasClass('a11yAccordionItemHeaderLink')).to.be.true;

          expect(
            focusedEl
              .parent()
              .find('.a11yAccordionItemHeaderText')
              .text()
          ).to.equal('Header 2');
          done();
        };

        var a11yAccordion = new A11yAccordion(customOptions);

        checkVisibility(a11yAccordion, index, false);

        // immitate click event
        a11yAccordion.refs.el.find('.a11yAccordionItemHeader').eq(2).click();
      });
    });

    describe('uncollapseRow and _uncollapse', function() {
      it('onAreaShow', function(done) {
        var customOptions = _.clone(testOptions, true);
        var index = 2;

        customOptions.onAreaShow = function(element) {
          expect(element.length).to.equal(1);
          expect($(element).hasClass('a11yAccordionHideArea')).to.equal(true);
          expect($(element).hasClass('a11yAccordion-area')).to.equal(true);

          done();
        };

        var a11yAccordion = new A11yAccordion(customOptions);

        a11yAccordion.uncollapseRow(index);
      });

      it('regular functionality', function(done) {
        var customOptions = _.clone(testOptions, true);
        var index = 2;

        customOptions.onAreaShow = function(element) {
          expect(element.length).to.equal(1);
          checkVisibility(a11yAccordion, index, true);
          done();
        };

        var a11yAccordion = new A11yAccordion(customOptions);

        checkVisibility(a11yAccordion, index, false);

        a11yAccordion.uncollapseRow(index);
      });

      it('showOne is set to true', function(done) {
        var a11yAccordion = new A11yAccordion(testOptions);

        checkVisibility(a11yAccordion, 2, false);

        a11yAccordion.props.onAreaShow = function() {
          var index = 0;

          a11yAccordion.props.onAreaShow = function() {
            end(++index);
          };
          a11yAccordion.props.onAreaHide = function() {
            end(++index);
          };

          var end = function(index) {
            if (index !== 2) {
              return;
            }

            checkVisibility(a11yAccordion, 2, false);
            checkVisibility(a11yAccordion, 3, true);
            done();
          };

          checkVisibility(a11yAccordion, 2, true);
          a11yAccordion.uncollapseRow(3);
        };

        a11yAccordion.uncollapseRow(2);
      });

      it('showOne is set to false', function(done) {
        var customOptions = _.clone(testOptions, true);
        customOptions.showOne = false;

        var a11yAccordion = new A11yAccordion(customOptions);

        checkVisibility(a11yAccordion, 2, false);

        a11yAccordion.props.onAreaShow = function() {
          a11yAccordion.props.onAreaShow = function() {
            checkVisibility(a11yAccordion, 2, true);
            checkVisibility(a11yAccordion, 3, true);
            done();
          };

          checkVisibility(a11yAccordion, 2, true);
          a11yAccordion.uncollapseRow(3);
        };

        a11yAccordion.uncollapseRow(2);
      });
    });

    describe('collapseRow and _collapse', function() {
      it('onAreaHide', function(done) {
        var customOptions = _.clone(testOptions, true);
        var index = 2;

        customOptions.onAreaHide = function(element) {
          expect(element.length).to.equal(1);
          expect($(element).hasClass('a11yAccordionHideArea')).to.equal(true);
          expect($(element).hasClass('a11yAccordion-area')).to.equal(true);

          done();
        };

        var a11yAccordion = new A11yAccordion(customOptions);

        a11yAccordion.props.onAreaShow = function() {
          a11yAccordion.collapseRow(index);
        };

        a11yAccordion.uncollapseRow(index);
      });

      it('regular functionality', function(done) {
        var customOptions = _.clone(testOptions, true);
        var index = 2;

        customOptions.onAreaHide = function(element) {
          expect(element.length).to.equal(1);
          checkVisibility(a11yAccordion, index, false);
          checkTriangle(a11yAccordion, index, false);

          done();
        };

        var a11yAccordion = new A11yAccordion(customOptions);

        a11yAccordion.props.onAreaShow = function() {
          checkVisibility(a11yAccordion, index, true);
          checkTriangle(a11yAccordion, index, true);

          a11yAccordion.collapseRow(index);
        };

        a11yAccordion.uncollapseRow(index);
      });
    });

    it('toggleRow', function(done) {
      var customOptions = _.clone(testOptions, true);
      var index = 2;

      customOptions.onAreaHide = function(element) {
        checkVisibility(a11yAccordion, index, false);
        checkTriangle(a11yAccordion, index, false);

        done();
      };
      customOptions.onAreaShow = function(element) {
        checkVisibility(a11yAccordion, index, true);
        checkTriangle(a11yAccordion, index, true);

        a11yAccordion.toggleRow(index);
      };

      var a11yAccordion = new A11yAccordion(customOptions);
      checkVisibility(a11yAccordion, index, false);
      checkTriangle(a11yAccordion, index, false);

      a11yAccordion.toggleRow(index);
    });

    it('getRowEl', function() {
      var a11yAccordion = new A11yAccordion(testOptions),
          row;

      row = a11yAccordion.getRowEl(-1);
      expect(row).to.be.undefined;

      row = a11yAccordion.getRowEl(2);
      expect(row[0].id).to.equal('a11yAccordion-row-2');
    });

    // Private

    it('_collapseAll', function(done) {
      var customOptions = _.clone(testOptions, true);
      var index = 0;

      customOptions.showOne = false;
      customOptions.onAreaHide = function(element) {
        index ++;

        if (index === 2) {
          checkVisibility(a11yAccordion, 2, false);
          checkVisibility(a11yAccordion, 3, false);
          done();
        }
      };
      customOptions.onAreaShow = function(element) {
        index++;

        if (index === 2) {
          index = 0;

          checkVisibility(a11yAccordion, 2, true);
          checkVisibility(a11yAccordion, 3, true);

          a11yAccordion._collapseAll();
        }
      };

      var a11yAccordion = new A11yAccordion(customOptions);

      checkVisibility(a11yAccordion, 2, false);
      checkVisibility(a11yAccordion, 3, false);

      a11yAccordion.uncollapseRow(2);
      a11yAccordion.uncollapseRow(3);
    });

    it('_getHiddenArea', function() {
      var a11yAccordion = new A11yAccordion(testOptions);
      var hiddenArea;

      hiddenArea = a11yAccordion._getHiddenArea(-1);

      expect(hiddenArea).to.be.undefined;

      hiddenArea = a11yAccordion._getHiddenArea(1);
      expect(hiddenArea).not.to.be.undefined;
      expect(hiddenArea.is(':visible')).to.be.false;
    });

    describe('Nested accordions', function() {
      after(function() {
        $('#accordion1A').empty();
      });

      it('regular functionality', function(done) {
        // Init 2 accordions:

        var onAreaShow = function(element) {
          expect(element.length).to.equal(1);
          checkVisibility(a11yAccordion, index, true);

          // Check that proper link is in focus
          var focusedEl = $(document.activeElement);

          expect(focusedEl.hasClass('a11yAccordionItemHeaderLink')).to.be.true;

          expect(
            focusedEl
              .parent()
              .find('.a11yAccordionItemHeaderText')
              .text()
          ).to.equal('Header 2');
          done();
        };

        var accordion1a = new A11yAccordion({
          parentSelector: '#accordion1A',
          hiddenLinkDescription: 'row with data in the First Accordion',
          onAreaShow: function(element) {
            expect(element.length).to.equal(1);
            checkVisibility(accordion1a, 0, true);
            checkVisibility(accordion1a, 1, false);
            checkVisibility(accordion1a, 2, false);
            checkVisibility(accordion2b, 0, false);
            checkVisibility(accordion2b, 1, false);
            checkVisibility(accordion2b, 2, false);

            // Check that proper link is in focus
            var focusedEl = $(document.activeElement);

            expect(
              focusedEl.hasClass('a11yAccordionItemHeaderLink')
            ).to.be.true;

            expect(
              focusedEl
                .parent()
                .find('.a11yAccordionItemHeaderText')
                .text()
                .trim()
            ).to.equal('Header A1');

            // immitate click event in inner accordion
            accordion2b.refs.el.find('.a11yAccordionItemHeader').eq(1).click();
          },
          onAreaHide: function(element) {
            expect(element.length).to.equal(1);
            checkVisibility(accordion1a, 0, false);
            checkVisibility(accordion1a, 1, false);
            checkVisibility(accordion1a, 2, false);
            checkVisibility(accordion2b, 0, false);
            checkVisibility(accordion2b, 1, false);
            checkVisibility(accordion2b, 2, false);

            // Check that proper link is in focus
            var focusedEl = $(document.activeElement);

            expect(
              focusedEl.hasClass('a11yAccordionItemHeaderLink')
            ).to.be.true;

            expect(
              focusedEl
                .parent()
                .find('.a11yAccordionItemHeaderText')
                .text()
                .trim()
            ).to.equal('Header A1');

            done(); // end of the execution
          }
        });

        var accordion2b = new A11yAccordion({
          parentSelector: '#accordion2B',
          hiddenLinkDescription: 'row with data in the First Accordion',
          onAreaShow: function(element) {
            expect(element.length).to.equal(1);
            checkVisibility(accordion1a, 0, true);
            checkVisibility(accordion1a, 1, false);
            checkVisibility(accordion1a, 2, false);
            checkVisibility(accordion2b, 0, false);
            checkVisibility(accordion2b, 1, true);
            checkVisibility(accordion2b, 2, false);

            // Check that proper link is in focus
            var focusedEl = $(document.activeElement);

            expect(
              focusedEl.hasClass('a11yAccordionItemHeaderLink')
            ).to.be.true;

            expect(
              focusedEl
                .parent()
                .find('.a11yAccordionItemHeaderText')
                .text()
                .trim()
            ).to.equal('Header B2');

            // immitate click event in inner accordion
            accordion2b.refs.el.find('.a11yAccordionItemHeader').eq(1).click();
          },
          onAreaHide: function(element) {
            expect(element.length).to.equal(1);
            checkVisibility(accordion1a, 0, true);
            checkVisibility(accordion1a, 1, false);
            checkVisibility(accordion1a, 2, false);
            checkVisibility(accordion2b, 0, false);
            checkVisibility(accordion2b, 1, false);
            checkVisibility(accordion2b, 2, false);

            // Check that proper link is in focus
            var focusedEl = $(document.activeElement);

            expect(
              focusedEl.hasClass('a11yAccordionItemHeaderLink')
            ).to.be.true;

            expect(
              focusedEl
                .parent()
                .find('.a11yAccordionItemHeaderText')
                .text()
                .trim()
            ).to.equal('Header B2');

            // immitate click event in outter accordion
            accordion1a.refs.el.find('.a11yAccordionItemHeader').eq(0).click();
          }
        });

        // immitate click event in outter accordion
        accordion1a.refs.el.find('.a11yAccordionItemHeader').eq(0).click();
      });
    });

  });
})(chai.expect);
