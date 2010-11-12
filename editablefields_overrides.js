
/**
 * This file normally gets included if the number of generated html_edit textareas
 * exceeds 'editablefields_textareas_resizable_threshold' variable.
 *
 * @see theme_editablefields_formatter_editable in editablefields.module
 */

// Adds the 'grippie' functionality to resizable textareas when the user clicks in them.
Drupal.behaviors.editablefields_overrides = function(context) {
  // add this only once per page. We are not taking 'context' into consideration on purpose here.
  if(!$('body').hasClass('editablefields-overrides-processed')) {
    $('body').addClass('editablefields-overrides-processed');

    // @todo: find a way to add the same functionality on focus event.
    $(document).bind('click', function(event){
      // add textarea handler
      if ($(event.target).is('textarea.resizable')) {
        Drupal.editablefields_overrides.textarea($(event.target).parent());
      }
    });
  }
}

/**
 * This file is included after misc/textarea.js so this simply overrides the default behavior.
 */
Drupal.behaviors.textarea = function(context) {}

// initialize
Drupal.editablefields_overrides = {};

/**
 * Clone of Drupal.behaviors.textarea
 */
Drupal.editablefields_overrides.textarea = function(context) {
  $('textarea.resizable:not(.textarea-processed)', context).each(function() {
    // Avoid non-processed teasers.
    if ($(this).is(('textarea.teaser:not(.teaser-processed)'))) {
      return false;
    }
    var textarea = $(this).addClass('textarea-processed'), staticOffset = null;

    // When wrapping the text area, work around an IE margin bug.  See:
    // http://jaspan.com/ie-inherited-margin-bug-form-elements-and-haslayout
    $(this).wrap('<div class="resizable-textarea"><span></span></div>')
      .parent().append($('<div class="grippie"></div>').mousedown(startDrag));

    var grippie = $('div.grippie', $(this).parent())[0];
    grippie.style.marginRight = (grippie.offsetWidth - $(this)[0].offsetWidth) +'px';

    function startDrag(e) {
      staticOffset = textarea.height() - e.pageY;
      textarea.css('opacity', 0.25);
      $(document).mousemove(performDrag).mouseup(endDrag);
      return false;
    }

    function performDrag(e) {
      textarea.height(Math.max(32, staticOffset + e.pageY) + 'px');
      return false;
    }

    function endDrag(e) {
      $(document).unbind("mousemove", performDrag).unbind("mouseup", endDrag);
      textarea.css('opacity', 1);
    }
  });
};
