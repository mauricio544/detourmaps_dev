from django.shortcuts import render
from django.shortcuts import render_to_response
from django.template import RequestContext


# Create your views here.
def single(request):
    return render_to_response('community/index.html', {}, context_instance=RequestContext(request))
