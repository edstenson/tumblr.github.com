$(document).ready(function() {
  var $window = $(window)

  var $months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  function resizeThumbnails(selector, extraPadding) {
    var tallest = 0;
    $(selector).find(".thumbnail").each(function(i, e) {
      var thisHeight = $(this).height();
      if (thisHeight > tallest) {
        tallest = thisHeight
      }
    })
    $(selector).find(".thumbnail").each(function(i, e) {
      $(this).height(tallest + extraPadding)
    })
  }

  function addRecentlyUpdatedRepo(repo) {
    var item = $("<li>");

    var name = $("<a>").attr("href", repo.html_url).text(repo.name);
    item.append($("<span>").addClass("name").append(name));

    var convertedTime = repo.pushed_at
    try {
      var date = new Date(Date.parse(convertedTime))
      convertedTime = $months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
    } catch(err) {
      convertedTime = repo.pushed_at
    }
    var time = $("<a>").attr("href", repo.html_url + "/commits").text(convertedTime)
    item.append($("<span>").addClass("time").append(time));

    item.append('<span class="bullet">&sdot;</span>');

    var watchers = $("<a>").attr("href", repo.html_url + "/watchers").text(repo.watchers + " watchers");
    item.append($("<span>").addClass("watchers").append(watchers));

    item.append('<span class="bullet">&sdot;</span>');

    var forks = $("<a>").attr("href", repo.html_url + "/network").text(repo.forks + " forks");
    item.append($("<span>").addClass("forks").append(forks));

    item.appendTo("#recently-updated");
  }

  function addRepo(repo, repo_count) {
    var item = $("<li>").addClass("span4")
    var project = $("<div>").addClass("thumbnail project")

    var project_header = $("<div>").addClass("project-header")
    var h3 = $("<h3>")
    var project_link = $("<a>").attr("href", repo.html_url).text(repo.name)
    project_header.append(h3.append(project_link))
    project.append(project_header)

    project.append($("<p>").text(repo.description))
    var language = repo.language || "Text"
    project.append($("<p>").addClass("project-language").text(language))
    project.append($("<p>").addClass("project-watchers").text(repo.watchers))
    project.append($("<p>").addClass("project-forks").text(repo.forks))

    var links = $("<p>")
    links.append($("<a>").attr("href", repo.html_url + "/fork-select").addClass("btn btn-primary").text("Fork"))
    links.append(" ")
    links.append($("<a>").attr("href", repo.html_url).addClass("btn").text("Follow"))
    project.append(links)

    item.append(project)
    item.appendTo("#projects")
    resizeThumbnails("#projects", 0)
  }

  $.getJSON("https://api.github.com/orgs/tumblr/members?callback=?", function(result) {
    var members = result.data
    $("#num-members").text(members.length)
  })

  $.getJSON("https://api.github.com/orgs/tumblr/repos?callback=?&per_page=100&page=1", function(result) {
    var repos = $.grep(result.data, function(o, idx) {
      return (o.name != "tumblr.github.com");
    })
    $("#num-repos").text(repos.length)
    repos = $.map(repos, function(repo, idx) {
      repo.pushed_at = new Date(repo.pushed_at)
      var weekHalfLife  = 1.146 * Math.pow(10, -9)
      var pushDelta    = (new Date) - Date.parse(repo.pushed_at)
      var createdDelta = (new Date) - Date.parse(repo.created_at)
      var weightForPush = 1
      var weightForWatchers = 1.314 * Math.pow(10, 7)
      repo.hotness = weightForPush * Math.pow(Math.E, -1 * weekHalfLife * pushDelta)
      repo.hotness += weightForWatchers * repo.watchers / createdDelta
      return repo;
    })
    repos.sort(function (a, b) {
      if (a.hotness < b.hotness) return 1;
      if (b.hotness < a.hotness) return -1;
      return 0;
    })
    var repo_count = 0
    $.each(repos, function(i, repo) {
      addRepo(repo, repo_count)
      repo_count += 1
    })
    repos.sort(function (a, b) {
      if (a.pushed_at < b.pushed_at) return 1;
      if (b.pushed_at < a.pushed_at) return -1;
      return 0;
    })
    $.each(repos.slice(0, 4), function(i, repo) {
      addRecentlyUpdatedRepo(repo)
    })
    $('[data-spy="scroll"]').each(function() {
      $(this).scrollspy('refresh')
    })
  })

  resizeThumbnails("#presentations", 10)
})
