from django.shortcuts import render
from django.shortcuts import render_to_response
from django.template import RequestContext


# Create your views here.
def single(request):
    return render_to_response('community/index.html', {}, context_instance=RequestContext(request))


def home(request):
    return render_to_response('community/home.html', {}, context_instance=RequestContext(request))


def aboutN(request):
    return render_to_response('community/about.html', {}, context_instance=RequestContext(request))


def howItWorksN(request):
    return render_to_response('community/howItWorks.html', {}, context_instance=RequestContext(request))


def deals(request):
    return render_to_response('community/deals.html', {}, context_instance=RequestContext(request))


def business(request):
    return render_to_response('community/business.html', {}, context_instance=RequestContext(request))


def community(request):
    return render_to_response('community/community.html', {}, context_instance=RequestContext(request))


def category(request):
    return render_to_response('community/category.html', {}, context_instance=RequestContext(request))


def orange(request):
    return render_to_response('community/orange-deals.html', {}, context_instance=RequestContext(request))


def test(request):
    return render_to_response('community/test.html', {}, context_instance=RequestContext(request))