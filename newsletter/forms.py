__author__ = 'mauricio'

from django import forms
#models
from newsletter.models import Body,Area,Map,Imagen

class FormBody(forms.ModelForm):
    text = forms.CharField(widget=forms.Textarea(attrs={'rows':'90','cols':'90'}))

    class Meta:
        model = Body
        exclude = ['user',]

class FormArea(forms.ModelForm):

    class Meta:
        model = Area

class FormMap(forms.ModelForm):

    class Meta:
        model = Map

    def __init__(self,*args,**kwargs):
        super(FormMap,self).__init__(*args,**kwargs)
        self.fields['nombre'].widget.attrs['id'] = 'map_nombre'

class FormImagen(forms.ModelForm):

    class Meta:
        model = Imagen
        exclude = ['user',]

    def __init__(self,*args,**kwargs):
        super(FormImagen,self).__init__(*args,**kwargs)
        self.fields['nombre'].widget.attrs['id'] = 'img_nombre'

class FormLogin(forms.Form):
    username = forms.CharField(required=True,max_length=12)
    password = forms.CharField(widget=forms.PasswordInput,required=True)
  
