// $Id$

/**
 * We use event delegation extensively for performance reasons.
 * $.live() function can achieve the same effect but is not
 * as efficient as this implementation. This also takes care of any additional DOM
 * changes that might happen in the page (ie. AJAX, AHAH, etc)
 *
 * Further reading about event delegation:
 *   http://blogs.sitepoint.com/2008/07/23/javascript-event-delegation-is-easier-than-you-think/
 *   http://developer.yahoo.com/yui/examples/event/event-delegation.html
 *   http://icant.co.uk/sandbox/eventdelegation/
 *
 **/

// @todo: Can only have one active clicktoedit datepicker field.
// @todo: (related to above todo) clicktoedit datepicker fields load twice after changing date.
Drupal.behaviors.editablefields = function(context) {
  // load the ajax-editable fields
  $('div.editablefields.ajax-editable', context).not('.editablefields-processed').each(function() {
    $(this).addClass('editablefields-processed');
    Drupal.editablefields.load(this);
  });

  // We are not taking 'context' into consideration on purpose here
  // in order to add event handlers only once per page.
  if (!$('body').hasClass('editablefields-processed')) {
    $('body').addClass('editablefields-processed');

    // bind a global document event handler
    $(document).bind('change click', function(event) {
      //console.log(event);
      if (event.type == 'change') {
        if ($(event.target).is('input, textarea, select')) {
          if ($(event.target).parents('.editablefields').not('.ajax-editable').length) {
            Drupal.editablefields.onchange($(event.target).parents('.editablefields'));
          }
        }
      }
      else if (event.type == 'click') {
        if ($(event.target).not('.ajax-editable').is('.editablefields')) {
          Drupal.editablefields.init.call($(event.target));
        }
        else if ($(event.target).parent('.editablefields').not('.ajax-editable').length) {
          Drupal.editablefields.init.call($(event.target).parent('.editablefields'));
        }
      }
    });
  }
}

// Initialize settings array.
Drupal.editablefields = {};

// Create a unique index for checkboxes
Drupal.editablefields.checkbox_fix_index = 0;

Drupal.editablefields.init = function() {
  $(this).unbind("click");
  $(this).parents('div.field').find('.field-label, .field-label-inline-first, .field-label-inline, .field-label-inline-last').addClass('highlighted');
  $(this).addClass('editablefields-processed');
  $(this).children().hide();
  Drupal.editablefields.load(this);
}

Drupal.editablefields.view = function(element) {
  if ($(element).hasClass("editablefields_REMOVE") ) {
    $(element).hide();
  }
  else {
    $(element).addClass('editablefields_throbber');

    var url = Drupal.settings.editablefields.url_view + "/" + $(element).attr("nid") + "/" + $(element).attr("field")+ "/" + $(element).attr("delta");
    $.ajax({
      url: url,
      type: 'GET',
      success: function(response) {
        // Call all callbacks.
        if (response.__callbacks) {
          $.each(response.__callbacks, function(i, callback) {
            eval(callback)(element, response);
          });
        }
        $(element).html(response.content);
        Drupal.attachBehaviors(element);
        var len = response.content.length;

        // there is not way for the server to know which formatter we are using for this field as the view is not
        // available during this request so we add the message with JS instead.
        if(len) {
          $(element).prepend(Drupal.settings.editablefields.clicktoedit_message);
        }
        else {
          $(element).prepend(Drupal.settings.editablefields.clicktoedit_message_empty);
        }

        $(element).bind("click",Drupal.editablefields.init);
        $(element).removeClass('editablefields_throbber');
        $(element).removeClass('editablefields-processed');
      },
      error: function(response) {
        $(".messages.error").remove();
        $(element).after('<div class="messages error">' + Drupal.t("An error occurred at ") + url + '</div>');
        $(".messages.error").hide(0).show(1000);
        $(element).removeClass('editablefields_throbber');
        $(element).removeClass('editablefields-processed');
      },
      dataType: 'json'
    });
  }
};

Drupal.editablefields.load = function(element) {
  $(".content .messages.status").remove();
  if ($(element).hasClass("editablefields_REMOVE") ) {
    $(element).hide();
  }
  else {
    $(element).addClass('editablefields_throbber');

    var url = Drupal.settings.editablefields.url_html + "/" + $(element).attr("nid") + "/" + $(element).attr("field")+ "/" + $(element).attr("delta");
    $.ajax({
      url: url,
      type: 'GET',
      success: function(response) {
        // If new datePopup settings were added, add our own onClose handler.
        // We need to do this before calling the returned callbacks.
        if (response.scripts.setting.datePopup) {
          for(var id in response.scripts.setting.datePopup) {
            response.scripts.setting.datePopup[id].settings['onClose'] = Drupal.editablefields.datepickerOnClose;
          }
        }

        // Call all callbacks.
        if (response.__callbacks) {
          $.each(response.__callbacks, function(i, callback) {
            eval(callback)(element, response);
          });
        }
        $(element).html(response.content);

        var isAjaxEditable = $(element).hasClass('ajax-editable');

        Drupal.attachBehaviors(element);
        var uniqNum = Drupal.editablefields.checkbox_fix_index++;
        $(element).find(':input').not(':hidden').each(function() {
          var $this = $(this);

          // Create a unique id field for checkboxes 
          if ($this.attr("type") == 'checkbox' || $this.attr("type") == 'radio') {
            $this.attr("id", $this.attr("id") + '-' + uniqNum);
          }

          // attach onChange event only for ajax-editable fields
          if(isAjaxEditable) {
            $this.change(function() {
              Drupal.editablefields.onchange(this);
            });
          }

          // datepicker fields are handled by the Drupal.editablefields.datepickerOnClose handler
          //if (!$('[id*="datepicker"]', $this)) {
            // add blur handler
            $this.blur(function() {
              window.setTimeout(function () {
                Drupal.editablefields.onblur($this)
              }, 10);
            });
          //}

          // Autofocus loaded elements. We need a small timeout here.
          if(!isAjaxEditable) {
            window.setTimeout(function(){
              $this.focus();
            }, 20);
          }
        });

        $(element).removeClass('editablefields_throbber');
      },
      error: function(response) {
        $(".messages.error").remove();
        $(element).after('<div class="messages error">' + Drupal.t("An error occurred at ") + url + '</div>');
        $(".messages.error").hide(0).show(1000);
        $(element).removeClass('editablefields_throbber');
      },
      dataType: 'json'
    });
  }
};

Drupal.editablefields.onchange = function(element) {
  if (!$(element).hasClass('editablefields')) {
    element = $(element).parents('div.editablefields');
  }

  // Provide some feedback to the user while the form is being processed.
  $(element).addClass('editablefields_throbber');

  if ($(element).hasClass('clicktoedit')) {
    // Send the field form for a 'clicktoedit' field.
    $.ajax({
      type: "POST",
      url: Drupal.settings.editablefields.url_submit, 
      data: $(element).find('form').serialize() + "&nid=" + $(element).attr("nid") + "&field=" + $(element).attr("field")+ "&delta=" + $(element).attr("delta"),
      element: $(element),
      success: function(msg) {
        $(element).removeClass('editablefields_throbber');
        $(".messages.error").hide(1000, function() {
          $(this).remove();
        });
        Drupal.editablefields.view(element);
      },
      error: function(msg) {
        $(".messages.error").remove();
        $(element).after('<div class="messages error">' + msg.responseText + '</div>');
        $(".messages.error").hide(0).show(1000);
        $(element).removeClass('editablefields_throbber');
        Drupal.editablefields.load(element);
      }
    });
  }
  else {
    // Send the field form for a 'editable' field.
    $.ajax({
      type: "POST",
      url: Drupal.settings.editablefields.url_submit, 
      data: $(element).find('form').serialize() + "&nid=" + $(element).attr("nid") + "&field=" + $(element).attr("field")+ "&delta=" + $(element).attr("delta"),
      element: $(element),
      success: function(msg) {
        $(element).removeClass('editablefields_throbber');
        // Re-enable the widget.
        $(".messages.error").hide(1000, function() {
          $(this).remove();
        });
        $(element).find(':input').each(function() {
          $(this).attr("disabled", false);
        });
      },
      error: function(msg) {
        $(".messages.error").remove();
        $(element).after('<div class="messages error">' + msg.responseText + '</div>');
        $(".messages.error").hide(0).show(1000);
        $(element).removeClass('editablefields_throbber');
        Drupal.editablefields.load(element);
      }
    });
  }

  // Ensure same changes are not submitted more than once.
  $(element).find(':input').each(function() {
    $(this).attr("disabled", true);
  });

  // Do not actually submit.
  return false;
};

Drupal.editablefields.onblur = function(element, forceClose) {
  // datepicker fields should collapse only when the user closes the matrix display
  if (!forceClose && $(element).hasClass('hasDatepicker')) {
    // this means that this handler has been called by the Drupal.editablefields.datepickerOnClose handler
    return false;
  }

  if (!$(element).hasClass('editablefields')) {
    element = $(element).parents('div.editablefields');
  }

  if ($(element).hasClass('clicktoedit')) {
    $(".messages.error").hide(1000, function() {
      $(this).remove();
    });
    $(element).parents('div.field').find('.highlighted').removeClass('highlighted');
    Drupal.editablefields.view(element);
  }

  return false;
};

/**
 * OnClose handler for datepicker fields.
 * This makes sure that clicktoedit datepicker fields automatically
 * blur when the datepicker gets closed. Otherwise we will have multiple
 * datepickers with the same ID on the page.
 */
Drupal.editablefields.datepickerOnClose = function(dateText, inst) {
  Drupal.editablefields.onblur($(this), true);
}
