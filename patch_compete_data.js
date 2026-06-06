const fs = require('fs');
const mk = d => { try { fs.mkdirSync(d, {recursive:true}) } catch {} };

mk('app/api/challenges');
fs.writeFileSync('app/api/challenges/route.js', Buffer.from('aW1wb3J0IHsgZ2V0U2Vzc2lvbiB9IGZyb20gJy4uLy4uLy4uL2xpYi9hdXRoJwoKY29uc3QgVVJMID0gcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMCmNvbnN0IEtFWSA9IHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZCmNvbnN0IGRiID0gewogIGdldDogKHQsIHE9JycpID0+IGZldGNoKGAke1VSTH0vcmVzdC92MS8ke3R9JHtxfWAsIHsgaGVhZGVyczogeyBhcGlrZXk6IEtFWSwgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke0tFWX1gIH0gfSkudGhlbihyID0+IHIuanNvbigpKSwKICBwb3N0OiAodCwgYikgPT4gZmV0Y2goYCR7VVJMfS9yZXN0L3YxLyR7dH1gLCB7IG1ldGhvZDonUE9TVCcsIGhlYWRlcnM6IHsgYXBpa2V5OiBLRVksIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtLRVl9YCwgJ0NvbnRlbnQtVHlwZSc6J2FwcGxpY2F0aW9uL2pzb24nLCBQcmVmZXI6J3JldHVybj1yZXByZXNlbnRhdGlvbicgfSwgYm9keTogSlNPTi5zdHJpbmdpZnkoYikgfSkudGhlbihyID0+IHIuanNvbigpKSwKICBwYXRjaDogKHQsIHEsIGIpID0+IGZldGNoKGAke1VSTH0vcmVzdC92MS8ke3R9JHtxfWAsIHsgbWV0aG9kOidQQVRDSCcsIGhlYWRlcnM6IHsgYXBpa2V5OiBLRVksIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtLRVl9YCwgJ0NvbnRlbnQtVHlwZSc6J2FwcGxpY2F0aW9uL2pzb24nLCBQcmVmZXI6J3JldHVybj1yZXByZXNlbnRhdGlvbicgfSwgYm9keTogSlNPTi5zdHJpbmdpZnkoYikgfSkudGhlbihyID0+IHIuanNvbigpKSwKICBkZWw6ICh0LCBxKSA9PiBmZXRjaChgJHtVUkx9L3Jlc3QvdjEvJHt0fSR7cX1gLCB7IG1ldGhvZDonREVMRVRFJywgaGVhZGVyczogeyBhcGlrZXk6IEtFWSwgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke0tFWX1gIH0gfSkudGhlbihyID0+IHIuc3RhdHVzKSwKfQoKLy8gR0VUIC9hcGkvY2hhbGxlbmdlcyDigJQgbGlzdCBvcGVuIEgySCBjaGFsbGVuZ2VzICsgdXNlcidzIGFjdGl2ZSBtYXRjaGVzCmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQocmVxdWVzdCkgewogIHRyeSB7CiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgZ2V0U2Vzc2lvbigpCiAgICBpZiAoIXNlc3Npb24pIHJldHVybiBSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdVbmF1dGhvcml6ZWQnIH0sIHsgc3RhdHVzOiA0MDEgfSkKICAgIGNvbnN0IHVpZCA9IHNlc3Npb24udXNlci5pZAoKICAgIC8vIE9wZW4gY2hhbGxlbmdlcyAod2FpdGluZyBmb3Igb3Bwb25lbnQpCiAgICBjb25zdCBvcGVuID0gYXdhaXQgZGIuZ2V0KCdUb3VybmFtZW50JywgYD90eXBlPWVxLmgyaCZzdGF0dXM9ZXEub3BlbiZzZWxlY3Q9KiZvcmRlcj1jcmVhdGVkQXQuZGVzYyZsaW1pdD0yMGApCiAgICAKICAgIC8vIE15IGFjdGl2ZSBtYXRjaGVzCiAgICBjb25zdCBteU1hdGNoZXMgPSBhd2FpdCBkYi5nZXQoJ0gySE1hdGNoJywgYD9vcj0oY2hhbGxlbmdlcklkLmVxLiR7dWlkfSxvcHBvbmVudElkLmVxLiR7dWlkfSkmc3RhdHVzPWluLihhY3RpdmUsd2FpdGluZykmc2VsZWN0PSomb3JkZXI9Y3JlYXRlZEF0LmRlc2NgKQogICAgCiAgICAvLyBNeSBpbnZpdGVzICh3YWl0aW5nLCBJJ20gb3Bwb25lbnQpCiAgICBjb25zdCBpbnZpdGVzID0gYXdhaXQgZGIuZ2V0KCdIMkhNYXRjaCcsIGA/b3Bwb25lbnRJZD1lcS4ke3VpZH0mc3RhdHVzPWVxLndhaXRpbmcmc2VsZWN0PSomb3JkZXI9Y3JlYXRlZEF0LmRlc2NgKQoKICAgIC8vIEdldCB1c2VyIG5hbWVzIGZvciBtYXRjaGVzCiAgICBjb25zdCB1c2VySWRzID0gWy4uLm5ldyBTZXQoWwogICAgICAuLi5teU1hdGNoZXMubWFwKG0gPT4gW20uY2hhbGxlbmdlcklkLCBtLm9wcG9uZW50SWRdKS5mbGF0KCksCiAgICAgIC4uLmludml0ZXMubWFwKG0gPT4gbS5jaGFsbGVuZ2VySWQpLAogICAgICAuLi5vcGVuLm1hcChtID0+IG0uY3JlYXRvcklkKSwKICAgIF0uZmlsdGVyKEJvb2xlYW4pKV0KCiAgICBsZXQgdXNlcnMgPSBbXQogICAgaWYgKHVzZXJJZHMubGVuZ3RoID4gMCkgewogICAgICB1c2VycyA9IGF3YWl0IGRiLmdldCgnVXNlcicsIGA/aWQ9aW4uKCR7dXNlcklkcy5qb2luKCcsJyl9KSZzZWxlY3Q9aWQsbmFtZSxlbWFpbGApCiAgICB9CiAgICBjb25zdCB1c2VyTWFwID0gT2JqZWN0LmZyb21FbnRyaWVzKHVzZXJzLm1hcCh1ID0+IFt1LmlkLCB1Lm5hbWUgfHwgdS5lbWFpbD8uc3BsaXQoJ0AnKVswXSB8fCAnVHJhZGVyJ10pKQoKICAgIC8vIEdldCBqb3VybmFsIHRyYWRlcyBmb3IgUCZMIGNhbGN1bGF0aW9uCiAgICBjb25zdCBqb3VybmFsVHJhZGVzID0gYXdhaXQgZGIuZ2V0KCdUcmFkZScsIGA/dXNlcklkPWVxLiR7dWlkfSZzZWxlY3Q9KiZvcmRlcj1jcmVhdGVkQXQuZGVzYyZsaW1pdD01MDBgKQoKICAgIC8vIENhbGN1bGF0ZSBQJkwgZm9yIGVhY2ggYWN0aXZlIG1hdGNoCiAgICBjb25zdCBtYXRjaGVzV2l0aFBubCA9IG15TWF0Y2hlcy5tYXAobSA9PiB7CiAgICAgIGNvbnN0IHN0YXJ0ID0gbS5zdGFydERhdGUgPyBuZXcgRGF0ZShtLnN0YXJ0RGF0ZSkgOiBudWxsCiAgICAgIGNvbnN0IGVuZCA9IG0uZW5kRGF0ZSA/IG5ldyBEYXRlKG0uZW5kRGF0ZSkgOiBudWxsCiAgICAgIGNvbnN0IG15VHJhZGVzID0gc3RhcnQgPyBqb3VybmFsVHJhZGVzLmZpbHRlcih0ID0+IHsKICAgICAgICBjb25zdCBkID0gbmV3IERhdGUodC5jcmVhdGVkQXQpCiAgICAgICAgcmV0dXJuIGQgPj0gc3RhcnQgJiYgKCFlbmQgfHwgZCA8PSBlbmQpCiAgICAgIH0pIDogW10KICAgICAgY29uc3QgbXlQbmwgPSBteVRyYWRlcy5yZWR1Y2UoKHMsIHQpID0+IHMgKyAocGFyc2VGbG9hdCh0LnBubCkgfHwgMCksIDApCiAgICAgIGNvbnN0IGlzQ2hhbGxlbmdlciA9IG0uY2hhbGxlbmdlcklkID09PSB1aWQKICAgICAgcmV0dXJuIHsKICAgICAgICAuLi5tLAogICAgICAgIGNoYWxsZW5nZXJOYW1lOiB1c2VyTWFwW20uY2hhbGxlbmdlcklkXSB8fCAnVHJhZGVyJywKICAgICAgICBvcHBvbmVudE5hbWU6IG0ub3Bwb25lbnRJZCA/ICh1c2VyTWFwW20ub3Bwb25lbnRJZF0gfHwgJ1RyYWRlcicpIDogJ1dhaXRpbmcuLi4nLAogICAgICAgIG15UG5sOiBteVBubC50b0ZpeGVkKDIpLAogICAgICAgIG15Um9sZTogaXNDaGFsbGVuZ2VyID8gJ2NoYWxsZW5nZXInIDogJ29wcG9uZW50JywKICAgICAgICB0aW1lTGVmdDogZW5kID8gZ2V0VGltZUxlZnQoZW5kKSA6IG51bGwsCiAgICAgIH0KICAgIH0pCgogICAgcmV0dXJuIFJlc3BvbnNlLmpzb24oewogICAgICBvcGVuOiBvcGVuLm1hcChjID0+ICh7IC4uLmMsIGNyZWF0b3JOYW1lOiB1c2VyTWFwW2MuY3JlYXRvcklkXSB8fCAnVHJhZGVyJyB9KSksCiAgICAgIG15TWF0Y2hlczogbWF0Y2hlc1dpdGhQbmwsCiAgICAgIGludml0ZXM6IGludml0ZXMubWFwKGkgPT4gKHsgLi4uaSwgY2hhbGxlbmdlck5hbWU6IHVzZXJNYXBbaS5jaGFsbGVuZ2VySWRdIHx8ICdUcmFkZXInIH0pKSwKICAgIH0pCiAgfSBjYXRjaChlKSB7CiAgICBjb25zb2xlLmVycm9yKCdDaGFsbGVuZ2VzIEdFVCBlcnJvcjonLCBlLm1lc3NhZ2UpCiAgICByZXR1cm4gUmVzcG9uc2UuanNvbih7IGVycm9yOiBlLm1lc3NhZ2UgfSwgeyBzdGF0dXM6IDUwMCB9KQogIH0KfQoKLy8gUE9TVCAvYXBpL2NoYWxsZW5nZXMg4oCUIGNyZWF0ZSBhIG5ldyBjaGFsbGVuZ2UKZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFBPU1QocmVxdWVzdCkgewogIHRyeSB7CiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgZ2V0U2Vzc2lvbigpCiAgICBpZiAoIXNlc3Npb24pIHJldHVybiBSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdVbmF1dGhvcml6ZWQnIH0sIHsgc3RhdHVzOiA0MDEgfSkKICAgIGNvbnN0IHsgdHlwZSwgYXNzZXQsIGR1cmF0aW9uLCBzdGFrZSwgc3Rha2VUeXBlLCBkZXNjcmlwdGlvbiwgaW52aXRlVXNlcklkIH0gPSBhd2FpdCByZXF1ZXN0Lmpzb24oKQoKICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkKICAgIGNvbnN0IGVuZERhdGUgPSBuZXcgRGF0ZShub3cuZ2V0VGltZSgpICsgcGFyc2VEdXJhdGlvbihkdXJhdGlvbikpCgogICAgLy8gQ3JlYXRlIHRvdXJuYW1lbnQgcmVjb3JkCiAgICBjb25zdCB0b3VybmV5ID0gYXdhaXQgZGIucG9zdCgnVG91cm5hbWVudCcsIHsKICAgICAgY3JlYXRvcklkOiBzZXNzaW9uLnVzZXIuaWQsCiAgICAgIG5hbWU6IGAke3Nlc3Npb24udXNlci5uYW1lIHx8ICdUcmFkZXInfSB2cyAke2ludml0ZVVzZXJJZCA/ICdJbnZpdGVkJyA6ICdPcGVuJ31gLAogICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb24gfHwgJycsCiAgICAgIHR5cGU6ICdoMmgnLAogICAgICBzdGF0dXM6IGludml0ZVVzZXJJZCA/ICd3YWl0aW5nJyA6ICdvcGVuJywKICAgICAgYXNzZXRDbGFzc2VzOiBbYXNzZXRdLAogICAgICBtYXhDYWxsc1BlckRheTogOTksCiAgICAgIHN0YXJ0RGF0ZTogbm93LnRvSVNPU3RyaW5nKCksCiAgICAgIGVuZERhdGU6IGVuZERhdGUudG9JU09TdHJpbmcoKSwKICAgICAgYnV5SW46IHN0YWtlVHlwZSA9PT0gJ3JlYWwnID8gcGFyc2VGbG9hdChzdGFrZSkgfHwgMCA6IDAsCiAgICAgIHByaXplUG9vbDogc3Rha2VUeXBlID09PSAncmVhbCcgPyAocGFyc2VGbG9hdChzdGFrZSkgfHwgMCkgKiAyIDogMCwKICAgICAgY3JlYXRlZEF0OiBub3cudG9JU09TdHJpbmcoKSwKICAgIH0pCgogICAgaWYgKCF0b3VybmV5IHx8IHRvdXJuZXkuZXJyb3IpIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGNyZWF0ZSB0b3VybmFtZW50JykKICAgIGNvbnN0IHQgPSBBcnJheS5pc0FycmF5KHRvdXJuZXkpID8gdG91cm5leVswXSA6IHRvdXJuZXkKCiAgICAvLyBDcmVhdGUgSDJIIG1hdGNoCiAgICBjb25zdCBtYXRjaCA9IGF3YWl0IGRiLnBvc3QoJ0gySE1hdGNoJywgewogICAgICB0b3VybmFtZW50SWQ6IHQuaWQsCiAgICAgIGNoYWxsZW5nZXJJZDogc2Vzc2lvbi51c2VyLmlkLAogICAgICBvcHBvbmVudElkOiBpbnZpdGVVc2VySWQgfHwgbnVsbCwKICAgICAgc3RhdHVzOiBpbnZpdGVVc2VySWQgPyAnd2FpdGluZycgOiAnb3BlbicsCiAgICAgIGNoYWxsZW5nZXJTY29yZTogMCwKICAgICAgb3Bwb25lbnRTY29yZTogMCwKICAgICAgc3RhcnREYXRlOiBub3cudG9JU09TdHJpbmcoKSwKICAgICAgZW5kRGF0ZTogZW5kRGF0ZS50b0lTT1N0cmluZygpLAogICAgICBjcmVhdGVkQXQ6IG5vdy50b0lTT1N0cmluZygpLAogICAgfSkKCiAgICByZXR1cm4gUmVzcG9uc2UuanNvbih7IHN1Y2Nlc3M6IHRydWUsIG1hdGNoSWQ6IEFycmF5LmlzQXJyYXkobWF0Y2gpID8gbWF0Y2hbMF0/LmlkIDogbWF0Y2g/LmlkIH0pCiAgfSBjYXRjaChlKSB7CiAgICBjb25zb2xlLmVycm9yKCdDaGFsbGVuZ2VzIFBPU1QgZXJyb3I6JywgZS5tZXNzYWdlKQogICAgcmV0dXJuIFJlc3BvbnNlLmpzb24oeyBlcnJvcjogZS5tZXNzYWdlIH0sIHsgc3RhdHVzOiA1MDAgfSkKICB9Cn0KCi8vIFBBVENIIC9hcGkvY2hhbGxlbmdlcyDigJQgYWNjZXB0L2RlY2xpbmUvcmVzb2x2ZQpleHBvcnQgYXN5bmMgZnVuY3Rpb24gUEFUQ0gocmVxdWVzdCkgewogIHRyeSB7CiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgZ2V0U2Vzc2lvbigpCiAgICBpZiAoIXNlc3Npb24pIHJldHVybiBSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdVbmF1dGhvcml6ZWQnIH0sIHsgc3RhdHVzOiA0MDEgfSkKICAgIGNvbnN0IHsgbWF0Y2hJZCwgYWN0aW9uIH0gPSBhd2FpdCByZXF1ZXN0Lmpzb24oKQoKICAgIGlmIChhY3Rpb24gPT09ICdhY2NlcHQnKSB7CiAgICAgIGF3YWl0IGRiLnBhdGNoKCdIMkhNYXRjaCcsIGA/aWQ9ZXEuJHttYXRjaElkfWAsIHsKICAgICAgICBvcHBvbmVudElkOiBzZXNzaW9uLnVzZXIuaWQsCiAgICAgICAgc3RhdHVzOiAnYWN0aXZlJywKICAgICAgICBzdGFydERhdGU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSwKICAgICAgfSkKICAgICAgcmV0dXJuIFJlc3BvbnNlLmpzb24oeyBzdWNjZXNzOiB0cnVlIH0pCiAgICB9CgogICAgaWYgKGFjdGlvbiA9PT0gJ2RlY2xpbmUnKSB7CiAgICAgIGF3YWl0IGRiLnBhdGNoKCdIMkhNYXRjaCcsIGA/aWQ9ZXEuJHttYXRjaElkfWAsIHsgc3RhdHVzOiAnY2FuY2VsbGVkJyB9KQogICAgICByZXR1cm4gUmVzcG9uc2UuanNvbih7IHN1Y2Nlc3M6IHRydWUgfSkKICAgIH0KCiAgICBpZiAoYWN0aW9uID09PSAncmVzb2x2ZScpIHsKICAgICAgLy8gR2V0IG1hdGNoCiAgICAgIGNvbnN0IG1hdGNoZXMgPSBhd2FpdCBkYi5nZXQoJ0gySE1hdGNoJywgYD9pZD1lcS4ke21hdGNoSWR9JnNlbGVjdD0qYCkKICAgICAgY29uc3QgbSA9IG1hdGNoZXNbMF0KICAgICAgaWYgKCFtKSByZXR1cm4gUmVzcG9uc2UuanNvbih7IGVycm9yOiAnTWF0Y2ggbm90IGZvdW5kJyB9LCB7IHN0YXR1czogNDA0IH0pCgogICAgICAvLyBHZXQgam91cm5hbCB0cmFkZXMgZm9yIGJvdGggcGxheWVycyBkdXJpbmcgbWF0Y2ggd2luZG93CiAgICAgIGNvbnN0IHN0YXJ0ID0gbmV3IERhdGUobS5zdGFydERhdGUpCiAgICAgIGNvbnN0IGVuZCA9IG5ldyBEYXRlKG0uZW5kRGF0ZSkKCiAgICAgIGNvbnN0IFtjVHJhZGVzLCBvVHJhZGVzXSA9IGF3YWl0IFByb21pc2UuYWxsKFsKICAgICAgICBkYi5nZXQoJ1RyYWRlJywgYD91c2VySWQ9ZXEuJHttLmNoYWxsZW5nZXJJZH0mc2VsZWN0PXBubCxjcmVhdGVkQXRgKSwKICAgICAgICBtLm9wcG9uZW50SWQgPyBkYi5nZXQoJ1RyYWRlJywgYD91c2VySWQ9ZXEuJHttLm9wcG9uZW50SWR9JnNlbGVjdD1wbmwsY3JlYXRlZEF0YCkgOiBQcm9taXNlLnJlc29sdmUoW10pLAogICAgICBdKQoKICAgICAgY29uc3QgY2FsY1BubCA9IHRyYWRlcyA9PiB0cmFkZXMuZmlsdGVyKHQgPT4gewogICAgICAgIGNvbnN0IGQgPSBuZXcgRGF0ZSh0LmNyZWF0ZWRBdCk7IHJldHVybiBkID49IHN0YXJ0ICYmIGQgPD0gZW5kCiAgICAgIH0pLnJlZHVjZSgocywgdCkgPT4gcyArIChwYXJzZUZsb2F0KHQucG5sKSB8fCAwKSwgMCkKCiAgICAgIGNvbnN0IGNQbmwgPSBjYWxjUG5sKGNUcmFkZXMpCiAgICAgIGNvbnN0IG9QbmwgPSBjYWxjUG5sKG9UcmFkZXMpCiAgICAgIGNvbnN0IHdpbm5lcklkID0gY1BubCA+IG9QbmwgPyBtLmNoYWxsZW5nZXJJZCA6IGNQbmwgPCBvUG5sID8gbS5vcHBvbmVudElkIDogbnVsbCAvLyBudWxsID0gdGllCgogICAgICBhd2FpdCBkYi5wYXRjaCgnSDJITWF0Y2gnLCBgP2lkPWVxLiR7bWF0Y2hJZH1gLCB7CiAgICAgICAgc3RhdHVzOiAnY29tcGxldGVkJywKICAgICAgICB3aW5uZXJJZCwKICAgICAgICBjaGFsbGVuZ2VyU2NvcmU6IGNQbmwsCiAgICAgICAgb3Bwb25lbnRTY29yZTogb1BubCwKICAgICAgfSkKICAgICAgcmV0dXJuIFJlc3BvbnNlLmpzb24oeyBzdWNjZXNzOiB0cnVlLCB3aW5uZXJJZCwgY2hhbGxlbmdlclBubDogY1BubCwgb3Bwb25lbnRQbmw6IG9QbmwgfSkKICAgIH0KCiAgICByZXR1cm4gUmVzcG9uc2UuanNvbih7IGVycm9yOiAnVW5rbm93biBhY3Rpb24nIH0sIHsgc3RhdHVzOiA0MDAgfSkKICB9IGNhdGNoKGUpIHsKICAgIGNvbnNvbGUuZXJyb3IoJ0NoYWxsZW5nZXMgUEFUQ0ggZXJyb3I6JywgZS5tZXNzYWdlKQogICAgcmV0dXJuIFJlc3BvbnNlLmpzb24oeyBlcnJvcjogZS5tZXNzYWdlIH0sIHsgc3RhdHVzOiA1MDAgfSkKICB9Cn0KCmZ1bmN0aW9uIHBhcnNlRHVyYXRpb24oZCkgewogIGNvbnN0IG1hcCA9IHsgJzEgRGF5JzogODY0MDAwMDAsICczIERheXMnOiAyNTkyMDAwMDAsICcxIFdlZWsnOiA2MDQ4MDAwMDAsICcyIFdlZWtzJzogMTIwOTYwMDAwMCwgJzEgTW9udGgnOiAyNTkyMDAwMDAwIH0KICByZXR1cm4gbWFwW2RdIHx8IDYwNDgwMDAwMAp9CgpmdW5jdGlvbiBnZXRUaW1lTGVmdChlbmQpIHsKICBjb25zdCBkaWZmID0gbmV3IERhdGUoZW5kKSAtIG5ldyBEYXRlKCkKICBpZiAoZGlmZiA8PSAwKSByZXR1cm4gJ0VuZGVkJwogIGNvbnN0IGQgPSBNYXRoLmZsb29yKGRpZmYgLyA4NjQwMDAwMCkKICBjb25zdCBoID0gTWF0aC5mbG9vcigoZGlmZiAlIDg2NDAwMDAwKSAvIDM2MDAwMDApCiAgcmV0dXJuIGQgPiAwID8gYCR7ZH1kICR7aH1oYCA6IGAke2h9aGAKfQo=', 'base64'));
console.log('✓ app/api/challenges/route.js');

mk('app/api/group-contests');
fs.writeFileSync('app/api/group-contests/route.js', Buffer.from('aW1wb3J0IHsgZ2V0U2Vzc2lvbiB9IGZyb20gJy4uLy4uLy4uL2xpYi9hdXRoJwoKY29uc3QgVVJMID0gcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMCmNvbnN0IEtFWSA9IHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZCmNvbnN0IGRiID0gewogIGdldDogKHQsIHE9JycpID0+IGZldGNoKGAke1VSTH0vcmVzdC92MS8ke3R9JHtxfWAsIHsgaGVhZGVyczogeyBhcGlrZXk6IEtFWSwgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke0tFWX1gIH0gfSkudGhlbihyID0+IHIuanNvbigpKSwKICBwb3N0OiAodCwgYikgPT4gZmV0Y2goYCR7VVJMfS9yZXN0L3YxLyR7dH1gLCB7IG1ldGhvZDonUE9TVCcsIGhlYWRlcnM6IHsgYXBpa2V5OiBLRVksIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtLRVl9YCwgJ0NvbnRlbnQtVHlwZSc6J2FwcGxpY2F0aW9uL2pzb24nLCBQcmVmZXI6J3JldHVybj1yZXByZXNlbnRhdGlvbicgfSwgYm9keTogSlNPTi5zdHJpbmdpZnkoYikgfSkudGhlbihyID0+IHIuanNvbigpKSwKICBwYXRjaDogKHQsIHEsIGIpID0+IGZldGNoKGAke1VSTH0vcmVzdC92MS8ke3R9JHtxfWAsIHsgbWV0aG9kOidQQVRDSCcsIGhlYWRlcnM6IHsgYXBpa2V5OiBLRVksIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtLRVl9YCwgJ0NvbnRlbnQtVHlwZSc6J2FwcGxpY2F0aW9uL2pzb24nLCBQcmVmZXI6J3JldHVybj1yZXByZXNlbnRhdGlvbicgfSwgYm9keTogSlNPTi5zdHJpbmdpZnkoYikgfSkudGhlbihyID0+IHIuanNvbigpKSwKfQoKLy8gR0VUIOKAlCBsaXN0IGFjdGl2ZSBncm91cCBjb250ZXN0cyArIGxlYWRlcmJvYXJkCmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQoKSB7CiAgdHJ5IHsKICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBnZXRTZXNzaW9uKCkKICAgIGlmICghc2Vzc2lvbikgcmV0dXJuIFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ1VuYXV0aG9yaXplZCcgfSwgeyBzdGF0dXM6IDQwMSB9KQoKICAgIGNvbnN0IGNvbnRlc3RzID0gYXdhaXQgZGIuZ2V0KCdUb3VybmFtZW50JywgYD90eXBlPWVxLmdyb3VwJnN0YXR1cz1pbi4ob3BlbixhY3RpdmUpJnNlbGVjdD0qJm9yZGVyPWNyZWF0ZWRBdC5kZXNjJmxpbWl0PTIwYCkKICAgIAogICAgLy8gRm9yIGVhY2ggY29udGVzdCBnZXQgZW50cmllcwogICAgY29uc3QgY29udGVzdHNXaXRoRW50cmllcyA9IGF3YWl0IFByb21pc2UuYWxsKChjb250ZXN0cyB8fCBbXSkubWFwKGFzeW5jIGMgPT4gewogICAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgZGIuZ2V0KCdUb3VybmFtZW50RW50cnknLCBgP3RvdXJuYW1lbnRJZD1lcS4ke2MuaWR9JnNlbGVjdD0qYCkKICAgICAgY29uc3QgdXNlcklkcyA9IGVudHJpZXMubWFwKGUgPT4gZS51c2VySWQpLmZpbHRlcihCb29sZWFuKQogICAgICBsZXQgdXNlcnMgPSBbXQogICAgICBpZiAodXNlcklkcy5sZW5ndGggPiAwKSB7CiAgICAgICAgdXNlcnMgPSBhd2FpdCBkYi5nZXQoJ1VzZXInLCBgP2lkPWluLigke3VzZXJJZHMuam9pbignLCcpfSkmc2VsZWN0PWlkLG5hbWUsZW1haWxgKQogICAgICB9CiAgICAgIGNvbnN0IHVzZXJNYXAgPSBPYmplY3QuZnJvbUVudHJpZXModXNlcnMubWFwKHUgPT4gW3UuaWQsIHUubmFtZSB8fCB1LmVtYWlsPy5zcGxpdCgnQCcpWzBdIHx8ICdUcmFkZXInXSkpCiAgICAgIAogICAgICAvLyBHZXQgam91cm5hbCBQJkwgZm9yIGVhY2ggZW50cmFudAogICAgICBjb25zdCBlbnRyaWVzV2l0aFBubCA9IGF3YWl0IFByb21pc2UuYWxsKGVudHJpZXMubWFwKGFzeW5jIGUgPT4gewogICAgICAgIGNvbnN0IHRyYWRlcyA9IGF3YWl0IGRiLmdldCgnVHJhZGUnLCBgP3VzZXJJZD1lcS4ke2UudXNlcklkfSZzZWxlY3Q9cG5sLGNyZWF0ZWRBdGApCiAgICAgICAgY29uc3Qgc3RhcnQgPSBuZXcgRGF0ZShjLnN0YXJ0RGF0ZSkKICAgICAgICBjb25zdCBlbmQgPSBuZXcgRGF0ZShjLmVuZERhdGUpCiAgICAgICAgY29uc3QgcG5sID0gdHJhZGVzLmZpbHRlcih0ID0+IHsgY29uc3QgZCA9IG5ldyBEYXRlKHQuY3JlYXRlZEF0KTsgcmV0dXJuIGQgPj0gc3RhcnQgJiYgZCA8PSBlbmQgfSkKICAgICAgICAgIC5yZWR1Y2UoKHMsIHQpID0+IHMgKyAocGFyc2VGbG9hdCh0LnBubCkgfHwgMCksIDApCiAgICAgICAgcmV0dXJuIHsgLi4uZSwgbmFtZTogdXNlck1hcFtlLnVzZXJJZF0gfHwgJ1RyYWRlcicsIHBubCB9CiAgICAgIH0pKQogICAgICAKICAgICAgZW50cmllc1dpdGhQbmwuc29ydCgoYSwgYikgPT4gYi5wbmwgLSBhLnBubCkKICAgICAgcmV0dXJuIHsgLi4uYywgZW50cmllczogZW50cmllc1dpdGhQbmwsIGVudHJ5Q291bnQ6IGVudHJpZXMubGVuZ3RoIH0KICAgIH0pKQoKICAgIC8vIE15IGVudHJpZXMKICAgIGNvbnN0IG15RW50cmllcyA9IGF3YWl0IGRiLmdldCgnVG91cm5hbWVudEVudHJ5JywgYD91c2VySWQ9ZXEuJHtzZXNzaW9uLnVzZXIuaWR9JnNlbGVjdD10b3VybmFtZW50SWRgKQogICAgY29uc3QgbXlDb250ZXN0SWRzID0gbXlFbnRyaWVzLm1hcChlID0+IGUudG91cm5hbWVudElkKQoKICAgIHJldHVybiBSZXNwb25zZS5qc29uKHsgY29udGVzdHM6IGNvbnRlc3RzV2l0aEVudHJpZXMsIG15Q29udGVzdElkcyB9KQogIH0gY2F0Y2goZSkgewogICAgcmV0dXJuIFJlc3BvbnNlLmpzb24oeyBlcnJvcjogZS5tZXNzYWdlIH0sIHsgc3RhdHVzOiA1MDAgfSkKICB9Cn0KCi8vIFBPU1Qg4oCUIGNyZWF0ZSBjb250ZXN0IG9yIGpvaW4gY29udGVzdApleHBvcnQgYXN5bmMgZnVuY3Rpb24gUE9TVChyZXF1ZXN0KSB7CiAgdHJ5IHsKICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBnZXRTZXNzaW9uKCkKICAgIGlmICghc2Vzc2lvbikgcmV0dXJuIFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ1VuYXV0aG9yaXplZCcgfSwgeyBzdGF0dXM6IDQwMSB9KQogICAgY29uc3QgeyBhY3Rpb24sIGNvbnRlc3RJZCwgbmFtZSwgZGVzY3JpcHRpb24sIGFzc2V0LCBkdXJhdGlvbiwgYnV5SW4sIG1heEVudHJhbnRzIH0gPSBhd2FpdCByZXF1ZXN0Lmpzb24oKQoKICAgIGlmIChhY3Rpb24gPT09ICdqb2luJykgewogICAgICAvLyBDaGVjayBub3QgYWxyZWFkeSBqb2luZWQKICAgICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCBkYi5nZXQoJ1RvdXJuYW1lbnRFbnRyeScsIGA/dG91cm5hbWVudElkPWVxLiR7Y29udGVzdElkfSZ1c2VySWQ9ZXEuJHtzZXNzaW9uLnVzZXIuaWR9JnNlbGVjdD1pZGApCiAgICAgIGlmIChleGlzdGluZyAmJiBleGlzdGluZy5sZW5ndGggPiAwKSByZXR1cm4gUmVzcG9uc2UuanNvbih7IGVycm9yOiAnQWxyZWFkeSBqb2luZWQnIH0sIHsgc3RhdHVzOiA0MDAgfSkKICAgICAgCiAgICAgIGF3YWl0IGRiLnBvc3QoJ1RvdXJuYW1lbnRFbnRyeScsIHsKICAgICAgICB0b3VybmFtZW50SWQ6IGNvbnRlc3RJZCwKICAgICAgICB1c2VySWQ6IHNlc3Npb24udXNlci5pZCwKICAgICAgICBzY29yZTogMCwKICAgICAgICByYW5rOiAwLAogICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLAogICAgICB9KQogICAgICByZXR1cm4gUmVzcG9uc2UuanNvbih7IHN1Y2Nlc3M6IHRydWUgfSkKICAgIH0KCiAgICBpZiAoYWN0aW9uID09PSAnY3JlYXRlJykgewogICAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpCiAgICAgIGNvbnN0IGVuZERhdGUgPSBuZXcgRGF0ZShub3cuZ2V0VGltZSgpICsgcGFyc2VEdXJhdGlvbihkdXJhdGlvbikpCiAgICAgIAogICAgICBjb25zdCB0b3VybmV5ID0gYXdhaXQgZGIucG9zdCgnVG91cm5hbWVudCcsIHsKICAgICAgICBjcmVhdG9ySWQ6IHNlc3Npb24udXNlci5pZCwKICAgICAgICBuYW1lOiBuYW1lIHx8ICdHcm91cCBDb250ZXN0JywKICAgICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb24gfHwgJycsCiAgICAgICAgdHlwZTogJ2dyb3VwJywKICAgICAgICBzdGF0dXM6ICdvcGVuJywKICAgICAgICBhc3NldENsYXNzZXM6IFthc3NldCB8fCAnQW55J10sCiAgICAgICAgbWF4Q2FsbHNQZXJEYXk6IDk5LAogICAgICAgIHN0YXJ0RGF0ZTogbm93LnRvSVNPU3RyaW5nKCksCiAgICAgICAgZW5kRGF0ZTogZW5kRGF0ZS50b0lTT1N0cmluZygpLAogICAgICAgIGJ1eUluOiBwYXJzZUZsb2F0KGJ1eUluKSB8fCAwLAogICAgICAgIHByaXplUG9vbDogMCwKICAgICAgICBjcmVhdGVkQXQ6IG5vdy50b0lTT1N0cmluZygpLAogICAgICB9KQogICAgICAKICAgICAgY29uc3QgdCA9IEFycmF5LmlzQXJyYXkodG91cm5leSkgPyB0b3VybmV5WzBdIDogdG91cm5leQogICAgICAKICAgICAgLy8gQ3JlYXRvciBhdXRvLWpvaW5zCiAgICAgIGF3YWl0IGRiLnBvc3QoJ1RvdXJuYW1lbnRFbnRyeScsIHsKICAgICAgICB0b3VybmFtZW50SWQ6IHQuaWQsCiAgICAgICAgdXNlcklkOiBzZXNzaW9uLnVzZXIuaWQsCiAgICAgICAgc2NvcmU6IDAsIHJhbms6IDAsCiAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksCiAgICAgIH0pCiAgICAgIAogICAgICByZXR1cm4gUmVzcG9uc2UuanNvbih7IHN1Y2Nlc3M6IHRydWUsIGNvbnRlc3RJZDogdC5pZCB9KQogICAgfQoKICAgIHJldHVybiBSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdVbmtub3duIGFjdGlvbicgfSwgeyBzdGF0dXM6IDQwMCB9KQogIH0gY2F0Y2goZSkgewogICAgcmV0dXJuIFJlc3BvbnNlLmpzb24oeyBlcnJvcjogZS5tZXNzYWdlIH0sIHsgc3RhdHVzOiA1MDAgfSkKICB9Cn0KCmZ1bmN0aW9uIHBhcnNlRHVyYXRpb24oZCkgewogIGNvbnN0IG1hcCA9IHsgJzEgRGF5JzogODY0MDAwMDAsICczIERheXMnOiAyNTkyMDAwMDAsICcxIFdlZWsnOiA2MDQ4MDAwMDAsICcyIFdlZWtzJzogMTIwOTYwMDAwMCwgJzEgTW9udGgnOiAyNTkyMDAwMDAwIH0KICByZXR1cm4gbWFwW2RdIHx8IDYwNDgwMDAwMAp9Cg==', 'base64'));
console.log('✓ app/api/group-contests/route.js');

mk('app/api/leaderboard');
fs.writeFileSync('app/api/leaderboard/route.js', Buffer.from('aW1wb3J0IHsgZ2V0U2Vzc2lvbiB9IGZyb20gJy4uLy4uLy4uL2xpYi9hdXRoJwoKY29uc3QgVVJMID0gcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMCmNvbnN0IEtFWSA9IHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZCmNvbnN0IGRiID0gewogIGdldDogKHQsIHE9JycpID0+IGZldGNoKGAke1VSTH0vcmVzdC92MS8ke3R9JHtxfWAsIHsgaGVhZGVyczogeyBhcGlrZXk6IEtFWSwgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke0tFWX1gIH0gfSkudGhlbihyID0+IHIuanNvbigpKSwKfQoKZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIEdFVChyZXF1ZXN0KSB7CiAgdHJ5IHsKICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBnZXRTZXNzaW9uKCkKICAgIGlmICghc2Vzc2lvbikgcmV0dXJuIFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ1VuYXV0aG9yaXplZCcgfSwgeyBzdGF0dXM6IDQwMSB9KQoKICAgIGNvbnN0IHsgc2VhcmNoUGFyYW1zIH0gPSBuZXcgVVJMKHJlcXVlc3QudXJsKQogICAgY29uc3QgcGVyaW9kID0gc2VhcmNoUGFyYW1zLmdldCgncGVyaW9kJykgfHwgJ21vbnRoJwoKICAgIC8vIEdldCBhbGwgdXNlcnMKICAgIGNvbnN0IHVzZXJzID0gYXdhaXQgZGIuZ2V0KCdVc2VyJywgYD9zZWxlY3Q9aWQsbmFtZSxlbWFpbCZsaW1pdD0xMDBgKQogICAgCiAgICAvLyBHZXQgdHJhZGVzIGZvciBlYWNoIHVzZXIgaW4gdGltZSBwZXJpb2QKICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkKICAgIGNvbnN0IHBlcmlvZFN0YXJ0ID0gcGVyaW9kID09PSAnd2VlaycgPyBuZXcgRGF0ZShub3cgLSA3Kjg2NDAwMDAwKSA6CiAgICAgICAgICAgICAgICAgICAgICAgIHBlcmlvZCA9PT0gJ21vbnRoJyA/IG5ldyBEYXRlKG5vdyAtIDMwKjg2NDAwMDAwKSA6CiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBEYXRlKG5vdyAtIDM2NSo4NjQwMDAwMCkKCiAgICBjb25zdCBsZWFkZXJib2FyZCA9IGF3YWl0IFByb21pc2UuYWxsKHVzZXJzLm1hcChhc3luYyB1ID0+IHsKICAgICAgY29uc3QgdHJhZGVzID0gYXdhaXQgZGIuZ2V0KCdUcmFkZScsIGA/dXNlcklkPWVxLiR7dS5pZH0mc2VsZWN0PXBubCxjcmVhdGVkQXRgKQogICAgICBjb25zdCBwZXJpb2RUcmFkZXMgPSB0cmFkZXMuZmlsdGVyKHQgPT4gbmV3IERhdGUodC5jcmVhdGVkQXQpID49IHBlcmlvZFN0YXJ0KQogICAgICBjb25zdCB0b3RhbFBubCA9IHBlcmlvZFRyYWRlcy5yZWR1Y2UoKHMsIHQpID0+IHMgKyAocGFyc2VGbG9hdCh0LnBubCkgfHwgMCksIDApCiAgICAgIGNvbnN0IHdpbnMgPSBwZXJpb2RUcmFkZXMuZmlsdGVyKHQgPT4gcGFyc2VGbG9hdCh0LnBubCkgPiAwKS5sZW5ndGgKICAgICAgY29uc3Qgd2luUmF0ZSA9IHBlcmlvZFRyYWRlcy5sZW5ndGggPyBNYXRoLnJvdW5kKHdpbnMgLyBwZXJpb2RUcmFkZXMubGVuZ3RoICogMTAwKSA6IDAKICAgICAgCiAgICAgIC8vIEgySCByZWNvcmQKICAgICAgY29uc3Qgd2luc19oMmggPSBhd2FpdCBkYi5nZXQoJ0gySE1hdGNoJywgYD93aW5uZXJJZD1lcS4ke3UuaWR9JnN0YXR1cz1lcS5jb21wbGV0ZWQmc2VsZWN0PWlkYCkKICAgICAgY29uc3QgbWF0Y2hlcyA9IGF3YWl0IGRiLmdldCgnSDJITWF0Y2gnLCBgP29yPShjaGFsbGVuZ2VySWQuZXEuJHt1LmlkfSxvcHBvbmVudElkLmVxLiR7dS5pZH0pJnN0YXR1cz1lcS5jb21wbGV0ZWQmc2VsZWN0PWlkYCkKICAgICAgCiAgICAgIHJldHVybiB7CiAgICAgICAgaWQ6IHUuaWQsCiAgICAgICAgbmFtZTogdS5uYW1lIHx8IHUuZW1haWw/LnNwbGl0KCdAJylbMF0gfHwgJ1RyYWRlcicsCiAgICAgICAgcG5sOiB0b3RhbFBubCwKICAgICAgICB0cmFkZXM6IHBlcmlvZFRyYWRlcy5sZW5ndGgsCiAgICAgICAgd2luUmF0ZSwKICAgICAgICBoMndXaW5zOiB3aW5zX2gyaC5sZW5ndGggfHwgMCwKICAgICAgICBoMmhNYXRjaGVzOiBtYXRjaGVzLmxlbmd0aCB8fCAwLAogICAgICAgIGlzTWU6IHUuaWQgPT09IHNlc3Npb24udXNlci5pZCwKICAgICAgfQogICAgfSkpCgogICAgbGVhZGVyYm9hcmQuc29ydCgoYSwgYikgPT4gYi5wbmwgLSBhLnBubCkKICAgIGxlYWRlcmJvYXJkLmZvckVhY2goKGUsIGkpID0+IHsgZS5yYW5rID0gaSArIDEgfSkKCiAgICByZXR1cm4gUmVzcG9uc2UuanNvbih7IGxlYWRlcmJvYXJkOiBsZWFkZXJib2FyZC5maWx0ZXIoZSA9PiBlLnRyYWRlcyA+IDAgfHwgZS5pc01lKSB9KQogIH0gY2F0Y2goZSkgewogICAgcmV0dXJuIFJlc3BvbnNlLmpzb24oeyBlcnJvcjogZS5tZXNzYWdlIH0sIHsgc3RhdHVzOiA1MDAgfSkKICB9Cn0K', 'base64'));
console.log('✓ app/api/leaderboard/route.js');


let s = fs.readFileSync('components/CompeteTab.js', 'utf8');

// 1. Add React import for useCallback/useEffect if not present
if (!s.includes('useCallback')) {
  s = s.replace(
    "import React, { useState, useEffect, useRef } from 'react';",
    "import React, { useState, useEffect, useRef, useCallback } from 'react';"
  );
  console.log('✓ Added useCallback to imports');
}

// 2. Replace the static mock data in H2HTab with real state + API calls
// Find the block to replace - from const MY_MATCHES to end of LIVE array
const matchStart = s.indexOf('  const MY_MATCHES = [');
const liveEnd = s.indexOf('];', s.indexOf('const LIVE = [')) + 2;
if (matchStart > -1 && liveEnd > matchStart) {
  const newDataBlock = `  const [loading, setLoading] = React.useState(true);
  const [MY_MATCHES, setMyMatches] = React.useState([]);
  const [INVITES, setInvites] = React.useState([]);
  const [OPEN, setOpen] = React.useState([]);
  const LIVE = [];

  function getTimeLeft(end) {
    const diff = new Date(end) - new Date();
    if (diff <= 0) return 'Ended';
    const d = Math.floor(diff/86400000), h = Math.floor((diff%86400000)/3600000);
    return d > 0 ? d+'d '+h+'h' : h+'h';
  }
  function timeAgo(dt) {
    const diff = Date.now() - new Date(dt);
    const m2 = Math.floor(diff/60000), h2 = Math.floor(diff/3600000), d2 = Math.floor(diff/86400000);
    return d2 > 0 ? d2+'d ago' : h2 > 0 ? h2+'h ago' : m2+'m ago';
  }

  const loadData = React.useCallback(() => {
    setLoading(true);
    fetch('/api/challenges').then(r=>r.json()).then(d=>{
      if (!d.error) {
        setMyMatches((d.myMatches||[]).map(m=>({
          id: m.id, matchId: m.id,
          opponent: m.opponentName || 'Waiting...',
          asset: (m.assetClasses||['Any']).join(', '),
          duration: '—',
          stake: m.buyIn > 0 ? '$'+m.buyIn : 'For fun',
          myPnl: (parseFloat(m.myPnl||0)>=0?'+':'')+'$'+parseFloat(m.myPnl||0).toFixed(2),
          oppPnl: '+$0.00',
          timeLeft: m.endDate ? getTimeLeft(m.endDate) : '—',
          status: parseFloat(m.myPnl||0) >= 0 ? 'winning' : 'losing',
        })));
        setInvites((d.invites||[]).map(i=>({
          id: i.id, matchId: i.id,
          from: i.challengerName || 'Trader',
          league: 'silver',
          asset: (i.assetClasses||['Any']).join(', '),
          duration: '—',
          stake: i.buyIn > 0 ? '$'+i.buyIn : 'For fun',
          message: i.description || 'Open challenge',
          received: i.createdAt ? timeAgo(i.createdAt) : '',
        })));
        setOpen((d.open||[]).map(c=>({
          id: c.id, tournamentId: c.id,
          poster: c.creatorName || 'Trader',
          league: 'silver',
          asset: (c.assetClasses||['Any']).join(', '),
          duration: '—',
          stake: c.buyIn > 0 ? '$'+c.buyIn : 'For fun',
          desc: c.description || 'Open challenge',
          posted: c.createdAt ? timeAgo(c.createdAt) : '',
          accepts: 0, max: 1, winRate: 0, wins: 0,
        })));
      }
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  React.useEffect(() => { loadData(); }, [loadData]);

  const acceptChallenge = async (matchId) => {
    await fetch('/api/challenges', {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({matchId,action:'accept'})});
    loadData();
  };
  const declineChallenge = async (matchId) => {
    await fetch('/api/challenges', {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({matchId,action:'decline'})});
    loadData();
  };
  const postChallenge = async (form) => {
    await fetch('/api/challenges', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({asset:form.asset,duration:form.duration,stake:form.stake,stakeType:'real',description:form.desc})});
    loadData();
    setSubTab('my matches');
  };`;
  s = s.slice(0, matchStart) + newDataBlock + s.slice(liveEnd);
  console.log('✓ H2HTab mock data replaced with real API calls');
} else {
  console.log('⚠ Could not find MY_MATCHES block, matchStart='+matchStart+' liveEnd='+liveEnd);
}

// 3. Wire Decline button
s = s.replace(
  `<button style={{ flex:1, padding:'9px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>Decline</button>`,
  `<button onClick={()=>declineChallenge(inv.matchId||inv.id)} style={{ flex:1, padding:'9px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>Decline</button>`
);

// 4. Wire Accept button in invites
s = s.replace(
  `<button onClick={() => setAccepted(inv)} style={{ flex:2, padding:'9px', borderRadius:8, border:'none', background:'var(--accent)', color:'#fff', fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer' }}>Accept \u2192</button>`,
  `<button onClick={()=>{setAccepted(inv);acceptChallenge(inv.matchId||inv.id);}} style={{ flex:2, padding:'9px', borderRadius:8, border:'none', background:'var(--accent)', color:'#fff', fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer' }}>Accept \u2192</button>`
);

// 5. Wire Post Challenge button
s = s.replace(
  `<button onClick={() => form.desc.trim() && (setAccepted({from:'posted',duration:form.duration,stake:form.stake}),setSubTab('my matches'))} disabled={!form.desc.trim()}`,
  `<button onClick={()=>{ if(!form.desc.trim()) return; postChallenge(form); }} disabled={!form.desc.trim()}`
);

// 6. Add empty state for browse tab
s = s.replace(
  `{subTab==='browse' && (\r\n        <div style={{ padding:'20px' }}>\r\n          <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>Open challenges matched to your league (Silver \u00b11)</div>\r\n          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>`,
  `{subTab==='browse' && (\r\n        <div style={{ padding:'20px' }}>\r\n          <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>Open challenges matched to your league (Silver \u00b11)</div>\r\n          {loading && <div style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13 }}>Loading...</div>}\r\n          {!loading && OPEN.length === 0 && <div style={{ textAlign:'center', padding:'60px' }}><div style={{ fontSize:36, marginBottom:12 }}>\u2694\ufe0f</div><div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:600, color:'var(--text)' }}>No open challenges yet</div><div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', marginTop:8 }}>Be the first to post one!</div></div>}\r\n          {!loading && <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>`
);
// close the extra div
s = s.replace(
  `      )}\r\n\r\n      {subTab==='my matches'`,
  `        </div>}\r\n      )}\r\n\r\n      {subTab==='my matches'`
);

fs.writeFileSync('components/CompeteTab.js', s, 'utf8');
console.log('✓ CompeteTab.js saved');
console.log('\nAll done! Run: rd /s /q .next & npm run dev');
