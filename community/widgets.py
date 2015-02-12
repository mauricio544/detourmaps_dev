# -*- coding: utf-8 -*-

from django import forms
from django.conf import settings
from django.utils.safestring import mark_safe

class ColorPickerWidget(forms.TextInput):
    class Media:
        css = {
            'all': (
                '/static/colors/css/colorpicker.css',
            )
        }
        js = (
            '/static/colors/js/colorpicker.js',
        )

    def __init__(self, language=None, attrs=None):
        self.language = language or settings.LANGUAGE_CODE[:2]
        super(ColorPickerWidget, self).__init__(attrs=attrs)

    def render(self, name, value, attrs=None):
        rendered = super(ColorPickerWidget, self).render(name, value, attrs)
        return rendered + mark_safe(u"""<script type="text/javascript">(function($){
$(function(){
    var preview = $('<div class="color-picker-preview"><div style="background-color:#%s"></div></div>').insertAfter('#id_%s');
    $('#id_%s').ColorPicker({
        color: '%s',
        onSubmit: function(hsb, hex, rgb, el) { $(el).val(hex); $(el).ColorPickerHide();$(preview).find('div').css('backgroundColor', '#' + hex); },
        onBeforeShow: function () { $(this).ColorPickerSetColor(this.value); }
    }).bind('keyup', function(){ $(this).ColorPickerSetColor(this.value); });
});})(django.jQuery);</script>""" % (value, name, name, value))


class TextEditorWidget(forms.Textarea):
    class Media:
        css = {
            'all': (
                settings.STATIC_URL + 'web-icon/css/font-awesome.css',
                settings.STATIC_URL + 'web/editor/css/editor.css'
            )
        }
        js = (
            '//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js',
            'http://code.jquery.com/jquery-migrate-1.2.1.min.js',
            settings.STATIC_URL + 'web/editor/js/editor.js'
        )

    def __init__(self, language=None, attrs=None):
        self.language = language or settings.LANGUAGE_CODE[:2]
        super(TextEditorWidget, self).__init__(attrs=attrs)

    def render(self, name, value, attrs=None):
        rendered = super(TextEditorWidget, self).render(name, value, attrs)
        return rendered + mark_safe(u'''<script type="text/javascript">
            $('#id_%s').myeditor({'width':'820','url': '/upload/'});
            </script>''' % name)